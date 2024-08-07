import ply.yacc as yacc
import sys, os, os.path
import traceback

# Get the token map from the lexer.  This is required.
from js_global import glob

from js_ast import *
from js_lex import tokens, StringLit, HexInt, LexWithPrev
from ply.lex import LexToken, Lexer

#AST nodes that are used in intermediate stages of parsing,
#but are NEVER EVER in the final AST tree.
from js_parser_only_ast import *
from js_process_ast_parser_only import *

import random

def get_lexer(p):
  lex = None
  if p:
    lex = p.lexer
  
  if not lex:
    lex = glob.g_lexer
    
  if not isinstance(lex, LexWithPrev):
    lex = lex._lexwithprev
  return lex
  
temp_idgen = [0]
def getTempName():
    id = temp_idgen[0]
    temp_idgen[0] += 1

    ret = "$_t%i" % id

    random.seed(id + hash(glob.g_file))

    for i in range(4):
        c = int(random.random()*23) + ord('a')
        ret += chr(c)

    return ret

precedence = (
  ("left", "COMMA"),
  ("left", "ASSIGN", "ASSIGNLSHIFT", "ASSIGNRSHIFT", "ASSIGNPLUS",
           "ASSIGNMINUS", "ASSIGNDIVIDE", "ASSIGNTIMES", "ASSIGNBOR",
           "ASSIGNBAND", "ASSIGNBXOR", "ASSIGNMOD", "ASSIGNLOR", "ASSIGNLAND"),
  ("left", "QEST", "COLON"),
  ("left", "ARROW"), #note this is a "fictitious" token
  ("left", "BNEGATE"),
  ("left", "DOUBLEQ"), #coalesing operator ??
  ("left", "LOR"),
  ("left", "LAND"),
  ("left", "BOR"),
  ("left", "BXOR"),
  ("left", "BAND"),
  ('nonassoc', 'LTHAN', 'GTHAN', 'EQUAL', "GTHANEQ",
               "NOTEQUAL_STRICT", "EQUAL_STRICT",
               "LTHANEQ", "NOTEQUAL"),
  ("left", "INSTANCEOF"),
  ("left", "IN"),
  ("left", "LSHIFT", "RSHIFT", "LLSHIFT", "RRSHIFT"),
  ("left", "PLUS", "MINUS"),
  ("left", "TIMES", "DIVIDE"),
  ("left", "EXPONENT"),
 # ("right", "RIGHTMOST"), #ficitious token
  ("right", "UMINUS"), #negation prefix operation, note this is a "fictitious" token
  ("right", "VAR_TYPE_PREC"), #ficitious token
  ("right", "BITINV"),
  ("right", "NOT"),
  ("right", "TYPEOF"),
  ("left", "LPAREN"),
  ("left", "LSBRACKET"),
  ("left", "DEC", "INC"),
  ("left", "NEW"),  
  ("left", "DOT", "COND_DOT"),
  #("left", "ID_TEMPL"),
  #("left", "GTHAN_TEMPL"),
  #("left", "LTHAN_TEMPL"),
  #("left", "ID_VAR_TYPE"),
  #("left", "ID_VAR_DECL"),
  #("left", "", ""),
)

this_module = sys.modules[__name__]

parsescope = {}
scopestack = []
def push_scope():
  global scopestack, parsescope
  scopestack.append(parsescope)
  parsescope = dict(parsescope)
  
def pop_scope():
  global scopestack, parsescope
  
  if len(scopestack) > 0:
    parsescope = scopestack.pop(-1)
  else:
    pass
    #traceback.print_stack()
    #sys.stderr.write("Warning: invalid pop_scope() in parse internals\n");

statestack = []
def push_state():
  global restrict_stacks, prodname_log, scopestack, parsescope
  statestack.append([restrict_stacks, prodname_log, glob.copy(), scopestack, parsescope])
  
  if glob.g_production_debug: 
    print("pushing state")

  glob.g_tried_semi = False
  restrict_stacks = {"noline": []}
  prodname_log = []
  scopestack = []
  parsescope = {}
  
  glob.reset()
  glob.g_production_debug = False
  
def scope_add(k, p):
  global parsescope
  
  ret = k in parsescope
  
  parsescope[k] = p
  return ret
  
def pop_state():
  global restrict_stacks, prodname_log, scopestack, parsescope
  if glob.g_production_debug:
    print("popping state")
  restrict_stacks, prodname_log, g, scopestack, parsescope = statestack.pop(-1)
  glob.load(g)
  
restrict_stacks = {"noline": []}
prodname_log = []

class YaccProductionCopy (list):
  def __str__(self):
    return "YaccProductionCopy(" + str(self.lineno) + ", " + str(self.lexpos) + ")"

def push_restrict(p, type1="noline", val=True):
  #print("bleh!", type1, restrict_stacks[type1], p.lexer.cur.value)
  restrict_stacks[type1].append([p.lexer.cur, val])
    
def pop_restrict(type1="noline"):
  if len(restrict_stacks[type1]) == 0:
    return
  return restrict_stacks[type1].pop(-1)

def restricted(type1="noline"):
  stack = restrict_stacks[type1]
  if (len(stack) > 0):
    ret = stack[-1]
    
    if ret[1]:
      i = len(stack)-1
      while i >= 0 and stack[i][1]:
        i -= 1
      
      if not ret[1]:
        ret = stack[i+1]
      
    if ret[1]: return ret[0]
    else: return None
  else:
    return None

def get_production():
  stack = traceback.extract_stack(limit=3)
  
  i = len(stack)-2
  while i >= 0 and stack[i][2].startswith("p_") == 0:
    i -= 1
  
  return stack[i][2].replace("p_", ""), getattr(this_module, stack[i][2])

def restrict_prev(type1="noline"):
  lst = restrict_stacks[type1]
  if len(lst) > 2:
    return lst[-2][0] if lst[-2][1] else None
  else:
    return None
  
def handle_semi_error(p):
  global parser 
  
  lex = get_lexer(p)
  
  if p and lex._no_semi_handling:
    return
    
  if glob.g_production_debug:
    sys.stderr.write(termColor("in handle_semi_error", "yellow") + "\n")
    
  tok = lex.peek()
  if len(lex.peeks) > 1:
    prev = lex.peeks[-2]
  else:
    prev = lex.prev
  cur = lex.cur
  
  if prev == None:
    prev = tok
  if cur == None:
    cur = tok
    
  if type(prev) == list: prev = prev[0]
  if type(cur) == list: cur = cur[0]
  if type(tok) == list: tok = tok[0]
  
  if p != None and type(p) != LexToken:
    print(list(p))

  ret = tok == None or cur == None or prev.lineno < tok.lineno

  ret = ret or tok.type == "RBRACKET" or prev.type == "RBRACKET" or prev.type == "RSBRACKET"
  ret = ret or cur.type == "RBRACKET"
  ret = ret or cur.type == "CLASS_PROP_PRE"

  if glob.g_production_debug:
    msg = str(ret) + " " + str(prev) + " " + str(cur) + " " + str(tok)
    msg += "\n" + str(prev.lineno) + " " + str(cur.lineno) + " " + str(tok.lineno)
    sys.stderr.write(termColor(msg, "blue") + "\n")

  p2 = restricted()
  #"""
  if p2 != None and not (prev.type in ["RSBRACKET", "RPAREN"] and restrict_prev() == None):
    if cur.type != "CLASS_PROP_PRE":
        ret = False
        p = p2

  #"""

  i = cur.lexer.lexpos
  ld = lex.lexer.lexdata
  lasttok = ""

  #print("semi", ret, cur, prev, lex.cur)

  if ret and not glob.g_tried_semi:
    t = LexToken()
    t.type = "SEMI"
    t.value = ";"
    t.lineno = lex.lineno
    t.lexpos = lex.lexpos

    lex.push_front(lex.cur)
    lex.push_front(t)

    #print("=-======>", cur)

    parser._parser.errok()
    glob.g_error = False
    glob.g_tried_semi = True
  else:
    ret = False
    glob.g_error = True
    glob.g_error_pre = p
    print("didn't handle semi error")

  return ret
  
def set_parse_globals_error(p):
  c, cid = [p.lexer.comment, p.lexer.comment_id]
  if cid != glob.g_comment_id:
    glob.g_comment_id = cid
    print(c)

  line = p.lineno if p is not None else -1
  if type(line) != int:
    line = line(0)

  if glob.g_production_debug:
    sys.stderr.write(termColor("in2 %s %i\n" % (get_production()[0], line), "yellow"))
  #prodname_log.append(get_production()[0])

  #"""
  if p.lexer.prev != None:
    glob.g_line = p.lexer.prev.lineno
  elif (p.lexer.cur != None):
    glob.g_line = p.lexer.cur.lineno
  else:
    glob.g_line = p.lineno
  #"""

  if type(glob.g_line) != int:
    glob.g_line = glob.g_line(0)
  if type(glob.g_line) != int:
    glob.g_line = glob.g_line(0)


def set_parse_globals_node(n):
    lexer = glob.g_lexer

    if n is None or isinstance(n, str):
        return

    glob.g_line = n.line
    glob.g_lexpos = n.lexpos
    
    lexer.lineno = glob.g_line
    lexer.lexpos = glob.g_lexpos
    
    glob.g_lexer._force_lexpos_line = [lexer.lexpos, n.line]
    
def raiseSyntaxError(node, msg):
    glob.g_error_msg = msg
    
    if not node or type(node) == "string" or type(node) == "number":
        glob.g_lexer._force_lexpos_line = [glob.g_lexpos, glob.g_line]
        raise SyntaxError(msg)
        
    glob.g_lexer._no_semi_handling = True
    set_parse_globals_node(node)
    
    raise SyntaxError(msg)
    
def set_parse_globals(p, extra_str=""):
  global prodname_log
  
  glob.g_tried_semi = False

  lexer = p.lexer
  if type(lexer) == LexWithPrev:
    lexer = lexer.lexer
    
  c, cid = [lexer.comment, lexer.comment_id]
  if c != None and cid-1 != glob.g_comment_id and c != "":
    glob.g_comment_id = cid-1
    glob.g_comment = c
    glob.g_comment_line = lexer.comments[lexer.comment_id-1][1]
    
  if glob.g_production_debug:
      line = p.lineno if p is not None else -1
      if type(line) != int:
        line = line(0)

      sstr = "in %s %s %i\n" % (get_production()[0], extra_str, line)
      sys.stderr.write(termColor(sstr, "yellow"))

  if glob.g_log_productions:
    prodname_log.append(get_production()[0])
    if len(prodname_log) > 20:
      prodname_log = prodname_log[-20:]

  """
  if p.lexer.prev is not None:
    glob.g_line = p.lexer.prev.lineno
  elif p.lexer.cur is not None:
    glob.g_line = p.lexer.cur.lineno
  else:
    glob.g_line = p.lineno
  if type(glob.g_line) != int:
    glob.g_line = glob.g_line(0)
  if type(glob.g_line) != int:
    glob.g_line = glob.g_line(0)
  """

  #l = 0
  #for i in range(len(p)):
  #  l = max(l, p.lexpos(i))
  
  l = None
  l2 = None

  for i in range(len(p)):
    span = list(p.lexspan(i))
      
    if type(p[i]) in [str, StringLit]:
      span[1] = span[0] + len(p[i])
    elif isinstance(p[i], Node):
      span[0] = min(p[i].lexpos, span[0])
      span[1] = max(p[i].lexpos2, span[1])
      pass

    for j in range(2):
      lp = span[j]
      
      if l is None or lp < l:
          l = lp
      if l2 is None or lp > l2:
          l2 = lp

  if l is None:
    l = l2 = -1
  
  #if l == 0 and p.lexer.cur != None:
  #  l = p.lexer.prev_lexpos - p.lexer.token_len(p.lexer.cur) - 1
  
  glob.g_lexpos = l
  glob.g_lexpos2 = l2
  p.lexpos2 = l

def p_statementlist(p):
  ''' statementlist : statement
                    | statement_nonctrl
                    | statementlist statement
                    | statementlist statement_nonctrl 
                    | 
  '''
  set_parse_globals(p)

  if len(p) == 1:
    p[0] = StatementList()
  elif len(p) == 2:
    n = StatementList()
    n.add(p[1])
    p[0] = n
  elif len(p) == 3:
    if type(p[1]) != StatementList:
      p[0] = StatementList()
      p[0].add(p[1])
      p[0].add(p[2])
    else:
      p[0] = p[1]
      if p[2] != None:
        p[0].add(p[2])

def p_push_scope(p):
  ''' push_scope :
  '''
  set_parse_globals(p)
  push_scope()
  
def p_pop_scope(p):
  ''' pop_scope :
  '''
  set_parse_globals(p)
  pop_scope()

def p_opt_colon_type(p):
  ''' opt_colon_type : COLON var_type
                     |
  '''
  set_parse_globals(p)

  if len(p) > 1:
    p[0] = p[2]
  
def p_assign_statement(p):
  '''assign_statement : assign COLON var_type
                      |
  '''
  set_parse_globals(p)

  if len(p) > 1:
    p[0] = p[1]
    p[0].type = p[3]
    
def p_bracketed_statementlist(p):
    '''bracketed_statementlist : LBRACKET statementlist RBRACKET'''
    set_parse_globals(p)

    p[0] = p[2]
    p[0].force_block = True
    
def p_statement(p):
  ''' statement : function
                | class
                | interface
                | typed_class
                | enum
                | if
                | else
                | while
                | with
                | dowhile
                | for
                | return SEMI
                | yield SEMI
                | break SEMI
                | continue SEMI
                | throw SEMI
                | try
                | catch
                | finally
                | switch
                | func_native SEMI
                | import_decl
                | export_decl
                | bracketed_statementlist
                | dynamic_import
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    if p[1] == None:
      p[0] = NullStatement()
    else:
      p[0] = p[1]
  else:
    p[0] = p[1];

def p_dynamic_import(p):
  '''
  dynamic_import : IMPORT LPAREN expr RPAREN
  '''
  p[0] = FuncCallNode(IdentNode("import"))
  p[0].add(p[3])

def p_import_decl(p):
  '''import_decl : IMPORT import_clause from_clause SEMI
                 | IMPORT module_spec SEMI
  '''
  set_parse_globals(p)

  if len(p) == 5:
    p[0] = p[2]
    if type(p[3]) == StrLitNode:
      p[0][0] = p[3]
    else:
      p[0][0].val = p[3] if not isinstance(p[3], IdentNode) else p[3].val
  elif len(p) == 4:
    p[0] = ImportNode()
    p[0].replace(p[0][0], p[2])
    
def p_import_clause(p):
  '''import_clause : import_def_bind
                   | name_space_import
                   | named_imports
                   | import_def_bind COMMA name_space_import
                   | import_def_bind COMMA named_imports
  '''
  
  set_parse_globals(p)

  if len(p) == 2:
    p[0] = ImportNode()
    
    if type(p[1]) != str:
      if isinstance(p[1], Node):
        p[0].add(p[1])
      else:
        for n in p[1]:
          p[0].add(n)
    else:
      p[0].add(StrLitNode(p[1]))
  else:
    p[0] = ImportNode()
    p[0].add(p[1])
    p[0].add(p[3])
  
def p_import_def_bind(p):
  '''import_def_bind : import_bind
  '''
  set_parse_globals(p)

  p[0] = p[1]
  
  if type(p[0]) == str:
    p[0] = BindingIdent(p[0])
    
  p[0].is_default_binding = True
  
def p_name_space_import(p):
  '''name_space_import : TIMES ID import_bind'''
  
  set_parse_globals(p)

  if p[2] != "as":
    raiseSyntaxError(p[3], "Expected 'as'")
    
  p[0] = ImportDeclNode("*")
  p[0].bindname = p[3]
  
def p_named_imports(p):
  ''' named_imports : LBRACKET RBRACKET
                    | LBRACKET import_list RBRACKET
  '''
  set_parse_globals(p)

  if len(p) == 3:
    p[0] = []
  elif len(p) == 4:
    p[0] = p[2]
    
def p_from_clause(p):
  ''' from_clause : FROM module_spec'''
  set_parse_globals(p)

  p[0] = p[2]

def p_import_list(p):
  ''' import_list : import_spec
                  | import_list COMMA import_spec
  '''
  set_parse_globals(p)

  if len(p) == 2:
    p[0] = [p[1]]
  else:
    p[0] = p[1]
    p[0].append(p[3])
  
    
def p_import_spec(p):
  '''
      import_spec : import_bind
                  | import_bind ID import_bind
  '''
  set_parse_globals(p)

  #second id is 'soft' keyword
  if len(p) ==4 and p[2] != "as":
    raiseSyntaxError(p[3], "Expected 'as'")
  
  if len(p) == 4:
    n = ImportDeclNode(p[1], p[3])
  else:
    n = ImportDeclNode(p[1])
  
  p[0] = n

def p_import_bind(p):
  ''' import_bind : binding_ident
  '''
  p[0] = p[1]

def p_module_spec(p):
  ''' module_spec : STRINGLIT
  '''
  
  set_parse_globals(p)

  p[0] = p[1]
  if type(p[0]) != StrLitNode:
    p[0] = StrLitNode(p[1])
  
  p[0].val = p[0].val.replace("'", "").replace("\"", "");

def p_binding_ident(p):
  ''' binding_ident : id
  '''
  p[0] = p[1].val
  set_parse_globals(p)


"""
def p_statement_error(p):
  ''' statement : return error
                | yield error
                | break error
                | continue error
                | throw error
  '''
  
  set_parse_globals_error(p);
  
  if p[1] == None or p[1] == ';':
    p[0] = NullStatement()
  else:
    p[0] = p[1]    
"""

def p_statement_nonctrl(p):
  ''' statement_nonctrl : expr SEMI
                        | var_decl SEMI
                        | funcref SEMI
                        | SEMI
                        | if
                        | else
                        | for
                        | dowhile
                        | while
                        | return SEMI
                        | yield SEMI
                        | break SEMI
                        | continue SEMI
                        | throw SEMI
                        | try
                        | catch
                        | finally
                        | delete SEMI
  '''
  set_parse_globals(p)
  
  if p[1] == None or p[1] == ';':
    p[0] = NullStatement()
  else:
    p[0] = p[1]

"""
def p_statement_nonctrl_error(p):
  ''' statement_nonctrl : expr error
                        | var_decl error
                        | delete error
                        | return error
                        | yield error
                        | break error
                        | continue error
                        | throw error
  '''
  
  set_parse_globals_error(p);
  if p[1] == None or p[1] == ';':
    p[0] = NullStatement()
  else:
    p[0] = p[1]    
"""

def p_var_decl_or_type(p):
  ''' var_decl_or_type : var_decl
                       | var_type
  '''
  
  set_parse_globals(p)
  p[0] = p[1]

def p_templatedeflist(p):
  '''
    templatedeflist : var_type
             | var_type ASSIGN var_type
             | templatedeflist COMMA var_type
             | templatedeflist COMMA var_type ASSIGN var_type
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = ExprListNode([])
    if p[1] is not None:
      p[0].add(p[1])
  elif len(p) == 4:
    if type(p[1]) == ExprListNode:
      p[0] = p[1]
      p[1].add(p[3])
    else:
      p[0] = ExprListNode([AssignNode(p[1], p[3])])
  elif len(p) == 6:
    p[0] = p[1]
    p[0].add(AssignNode(p[3], p[5]))
    
def p_template(p):
  '''template : lthan_restrict templatedeflist gthan_restrict
  '''
  set_parse_globals(p)
  
  p[0] = TemplateNode(p[2])
 
def p_type_modifiers(p):
  '''type_modifiers : type_modifiers SIGNED
                    | GLOBAL
                    | VAR
                    | CONST
                    | LET
                    | STATIC
  '''
  set_parse_globals(p)
   
  if len(p) == 3:
    p[0] = p[1]
    if p[2] == "var":
      p[2] = "local"
    p[0].add(p[2])   
  elif len(p) == 2:
    if p[1] == "var":
      p[1] = "local"
    
    p[0] = set([p[1]])
  elif len(p) == 1:
    p[0] = set("global");
    
def p_left_id(p):
  '''left_id : id ''' # %prec ID_TEMPL'''
  p[0] = p[1]

def p_id_opt(p):
  ''' id_opt : id
             |
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
  
def p_template_ref(p):
  '''template_ref : lthan_restrict simple_templatedeflist gthan_restrict
  '''
  set_parse_globals(p)

  p[0] = TemplateNode(p[2])

def p_template_ref_validate(p):
  '''template_ref_validate : lthan_restrict simple_templatedeflist gthan_restrict
  '''
  set_parse_globals(p)

  p[0] = TemplateNode(p[3])
  p[0].add(TypeRefNode(p[1]))
  
def p_template_validate(p):
  '''template_validate : template
                       | template_ref_validate
  '''
  #                     | lthan_restrict TYPEOF ID gthan_restrict
  #'''
  set_parse_globals(p)
  p[0] = p[1]
  
def p_lthan_restrict(p):
  '''lthan_restrict : TLTHAN 
  '''
  
  set_parse_globals(p, last_restrict_str())
  p[0] = p[1]
  
  push_restrict(p)

def last_restrict_str():
  if len(restrict_stacks["noline"]) == 0:
    extra_str = "len: 0"
  else:
    extra_str = str([restrict_stacks["noline"][-1][0].value, restrict_stacks["noline"][-1][1]]) + " len: %d"%len(restrict_stacks["noline"])
  return extra_str
  
def p_gthan_restrict(p):
  '''gthan_restrict : TGTHAN 
  '''
  set_parse_globals(p, last_restrict_str())
  
  p[0] = p[1]
  pop_restrict()

def p_id1(p):
  '''id_1 : id
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_var_decl_no_list(p):
  '''var_decl_no_list : var_type
                      | type_modifiers var_decl_no_list
                      | var_decl_no_list ASSIGN expr
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    if type(p[1]) == VarDeclNode:
      p[0] = p[1]
      scope_add(p[1].val, p[1])
    else:
      if type(p[1]) not in [VarDeclNode, IdentNode, BindingArg]:
        glob.g_error_pre = p
        glob.g_error = True
        print_err(p, False)
        raiseSyntaxError(p[1], "Invalid variable declaration")
      
      p[0] = VarDeclNode(ExprNode([]));
      if type(p[1]) == BindingArg:
        p[1] = IdentNode(p[1].val)
        p[0].spread = True
        
      p[0].val = p[1].val if not isinstance(p[1], IdentNode) else p[1].val
      p[0].type = UnknownTypeNode()
      p[0].add(p[0].type)
      p[0].local = False
      
      scope_add(p[0].val, p[0]);
      #possible global here, write code to check
  elif len(p) == 3:
    if type(p[1]) == VarDeclNode:
      p[0] = p[1]
      p[0].val = p[2] if not isinstance(p[2], IdentNode) else p[2].val
      
      if "local" in p[0].modifiers:
        p[0].local = True
      
      scope_add(p[0].val, p[0])
    elif type(p[1]) == set:
      p[0] = p[2]
      p[0].modifiers = p[1]
    else:
      p[0] = VarDeclNode(ExprNode([]))
      p[0].val = p[2] if not isinstance(p[2], IdentNode) else p[2].val
      p[0].type = p[1]
      p[0].add(p[2])
      p[0].local = False
      
      scope_add(p[0].val, p[0])
      #possible global here, write code to check
  elif len(p) == 4 and p[2] != ",":
    p[0] = p[1]    
    p[1].replace(p[1][0], p[3])

def p_typescript_var_decl(p):
  '''typescript_var_decl : ID
                         | ID_COLON var_type
  '''
  
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = VarDeclNode(ExprNode([]), name=p[1]);
  elif len(p) == 4:
    p[0] = VarDeclNode(ExprNode([]), name=p[1])
    
    if len(p[0]) < 2:
        p[0].add(p[3])
    else:
        p[0].replace(p[0][1], p[3])
    p[0].type = p[3]
    
def p_var_decl(p):
  '''var_decl : type_modifiers var_type
              | type_modifiers var_expand
              | var_decl ASSIGN expr
              | var_decl COMMA id
              | var_decl COMMA id ASSIGN expr
  '''
  set_parse_globals(p)
  
  if len(p) == 3:
    if type(p[2]) == ExpandNode:
        p[0] = p[2]
        for m in p[1]:
          p[0].modifiers.add(m)
          
    elif type(p[1]) != VarDeclNode:
      if type(p[2]) not in [VarDeclNode, IdentNode]:
        glob.g_error_pre = p
        glob.g_error = True
        print_err(p, False)
        raiseSyntaxError(p[2], "Invalid variable declaration")
        
      if type(p[2]) == VarDeclNode:
        p[0] = p[2]
      else:
        p[0] = VarDeclNode(ExprNode([]));
        #p[0].type = p[2]
        #p[0].add(p[0].type);
       
      if p[0].type == None:
        p[0].type = UnknownTypeNode()
        p[0].add(p[0].type)
        
      p[0].val = p[2].val
      p[0].modifiers = p[1]
      p[0].local = "global" not in p[1] and "local" in p[1];
      
      scope_add(p[0].val, p[0]);
  elif len(p) == 4 and p[2] == "=":
    if type(p[1]) == ExpandNode:
      if glob.g_destructuring:
        node = None
        tname = getTempName()
        temp = IdentNode(tname)

        p[0] = VarDeclNode(ExprNode([]))
        p[0].val = tname
        p[0].modifiers = p[1].modifiers
        p[0].replace(p[0][0], p[3])
        p[0].add(UnknownTypeNode())

        node = p[0]

        for i, n in enumerate(p[1]):
          n2 = VarDeclNode(ExprNode([]), name=n.val)
          n2.add(UnknownTypeNode())
          n2.modifiers = p[1].modifiers

          if p[1].etype == "array":
            n3 = ArrayRefNode(IdentNode(tname), IdentNode(str(i)))
            n2[0].add(n3)
          else:
            n3 = BinOpNode(IdentNode(tname), n.val, ".")
            n2[0].add(n3)

          n3.lexpos = n3[0].lexpos
          n3.lexpos2 = n3[0].lexpos2
          
          node.add(n2)
          node = n2
      else:
        p[0] = p[1]
        p[0].replace(p[0][0], AssignNode(p[0][1], p[3]))
    else:
      p[0] = p[1]
      if len(p[1][0]) == 0 and type(p[1][0]) == ExprNode:
        p[1].replace(p[1][0], p[3])
      else:
        p[1].replace(p[1][0], AssignNode(p[1][0], p[3]))
  elif len(p) == 4 and p[2] == ",":
    if type(p[3]) == IdentNode:
      p[3] = p[3].val
    
    if type(p[3]) == str:
      n = p[1].copy()
      n.children = [ExprNode([]), n.type];
      
      n.val = p[3] if not isinstance(p[3], IdentNode) else p[3].val
      scope_add(n.val, n)
      p[3] = n
      
    p[0] = p[1]
    p[0].add(p[3])
  elif len(p) == 6 and p[2] == ",":
    if type(p[3]) == IdentNode:
      p[3] = p[3].val
    
    if type(p[3]) == str:
      n = p[1].copy()
      n.children = [ExprNode([]), n.type];
      
      n.val = p[3] if not isinstance(p[3], IdentNode) else p[3].val
      scope_add(n.val, n)
      p[3] = n
    
    p[3].replace(p[3][0], p[5]);
    
    p[0] = p[1]
    p[0].add(p[3])

def p_ident_arr(p):
  '''ident_arr : id
               | ident_arr LSBRACKET NUMBER RSBRACKET
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = p[1]
  elif len(p) == 5:
    p[0] = StaticArrNode(p[1], p[3])
  
def p_var_decl_with_arr(p):
  '''var_decl_with_arr : type_modifiers var_type ident_arr
                       | var_decl_with_arr ASSIGN expr
                       | var_decl_with_arr COMMA ident_arr
                       | var_decl_with_arr COMMA ident_arr ASSIGN expr
  '''
  set_parse_globals(p)
  
  #always call this *before* adding p[0].type to p[0]!!
  def build_vdecl(r, t, n):
    r.type = t
    
    name = n
    while type(name) == StaticArrNode:
      name = name[0]
    
    if type(n) == StaticArrNode:
      name.parent.replace(name, t)
      r.type = n
      
    r.val = name.val
    
  if len(p) == 4 and p[2] not in ["=", ","]:
    p[0] = VarDeclNode(ExprListNode([]))
    build_vdecl(p[0], p[2], p[3])
    p[0].add(p[0].type)
  elif len(p) == 4 and p[2] == "=":
    p[0] = p[1]
    p[0].replace(p[0][0], p[3])
  elif len(p) == 4 and p[2] == ",":
    p[0] = p[1]
    n = p[0].copy()
    p[0].add(n)
    
    while len(n) > 0:
      n.remove(n[0])
    n.add(ExprNode([]))
    
    t = p[0].type
    while type(t) == StaticArrNode:
      t = t[0]
    
    build_vdecl(n, t, p[3])
    n.add(n.type)
  elif len(p) == 6:
    p[0] = p[1]
    n = p[0].copy()
    p[0].add(n)
    
    while len(n) > 0:
      n.remove(n[0])
    n.add(p[5])
    
    t = p[0].type
    while type(t) == StaticArrNode:
      t = t[0]
    
    build_vdecl(n, t, p[3])
    n.add(n.type)
    
def p_id_var_type(p):
  '''id_var_type : id 
  '''
  set_parse_globals(p, p[1])
  p[0] = p[1]

def p_id_var_decl(p):
  '''id_var_decl : id 
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_empty(p):
  '''empty : empty
           |
  '''
  set_parse_globals(p)

def p_var_fancy_list(p):
  '''var_fancy_list : id
                    | var_fancy_list COMMA id
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = ExpandNode([])
    p[0].add(p[1].val)
  else:
    p[0] = p[1]

    p[0].add(p[3].val)
  

def p_var_fancy_array(p):
  '''var_fancy_array : LSBRACKET var_fancy_list RSBRACKET'''
  
  set_parse_globals(p)
  p[0] = p[2]

def p_var_fancy_object(p):
  '''var_fancy_object : LBRACKET var_fancy_list RBRACKET'''
  
  set_parse_globals(p)
  p[0] = p[2]
  p[0].etype = "object"

def p_var_expand(p):
  '''var_expand : var_fancy_array
                | var_fancy_object
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_var_type_simple(p):
  ''' var_type_simple : id_var_type
                      | SHORT
                      | DOUBLE
                      | CHAR
                      | BYTE
                      | INFERRED
                      | TRIPLEDOT id_var_type
                      | var_type_simple template_ref
  '''
  p[0] = p[1]

def p_var_type(p):
  ''' var_type : var_type id_var_type
               | id_var_type
               | TRIPLEDOT id_var_type
               | SHORT
               | DOUBLE
               | CHAR
               | BYTE
               | INFERRED
               | var_type template_ref
  '''
  
  if type(p[1]) in [IdentNode, VarDeclNode]:
    extra_str = p[1].val
  else:
    extra_str = str(p[1])
  
  set_parse_globals(p, extra_str)
  
  if len(p) == 1:
    raise RuntimeError("internal parse error")
  elif len(p) == 2:
    p[0] = p[1]
    if type(p[0]) == str:
        p[0] = IdentNode(p[0])
  elif len(p) == 3:
    if type(p[1]) == str and p[1] == '...':
        p[0] = BindingArg(p[2])
        return
    if type(p[2]) == TemplateNode:
      if type(p[1]) not in [IdentNode, VarDeclNode]:
        glob.g_error_pre = p
        glob.g_error = True
        print_err(p, False)
        raiseSyntaxError(p[1], "Invalid variable declaration")
      p[0] = VarDeclNode(ExprNode([]))
        
      p[0].val = p[1].val
      
      pn = IdentNode(p[0].val)
      p[2].name_expr = pn
      p[2].add(pn)
      
      p[0].type = p[2]
      p[0].add(p[2])      
    elif type(p[1]) != VarDeclNode:
      p[0] = VarDeclNode(ExprNode([]))
      
      p[0].val = p[2].val
      if not p[1]:
        p[1] = UnknownTypeNode()
        
      p[0].type = p[1]
      p[0].add(p[1])
    else:
      p[0] = p[1]
      if isinstance(p[2], IdentNode) or isinstance(p[2], VarDeclNode):
        p[0].val = p[2].val

def p_typeof_opt(p):
  '''typeof_opt : TYPEOF
                |
  '''
  
  if len(p) == 2:
    p[0] = p[1]
    
def p_simple_templatedeflist(p):
  '''
    simple_templatedeflist : typeof_opt var_type
                           | simple_templatedeflist COMMA typeof_opt var_type
  '''
  set_parse_globals(p)
  
  if len(p) == 3:
    if p[1] != None:
      p[2] = TypeofNode(p[2])
    if p[2] is None:
      p[2] = IdentNode("undefined")
      
    p[0] = ExprListNode([p[2]])
  elif len(p) == 5:
    if p[3] != None:
      p[4] = TypeofNode(p[4])
      
    p[0] = p[1]
    p[1].add(p[4])
        
    
def p_simple_var_decl(p):
  '''simple_var_decl : VAR id
                     | LET id
                     | CONST id
                     | id
  '''
  
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = VarDeclNode(ExprNode([]), local=False)
    p[0].val = p[1] if not isinstance(p[1], IdentNode) else p[1].val
    p[0].add(UnknownTypeNode())
    p[0].type = p[0][1]
    scope_add(p[0].val, p[0])
  else:
    p[0] = VarDeclNode(ExprNode([]), local=True)
    p[0].val = p[2] if not isinstance(p[2], IdentNode) else p[2].val
    if p[1] == "let":
      p[0].modifiers.add("let");
    
    p[0].add(UnknownTypeNode())
    p[0].type = p[0][1]
    scope_add(p[0].val, p[0])
    
def p_cmplx_assign(p):
  '''cmplx_assign : ASSIGNPLUS 
                  | ASSIGNMINUS 
                  | ASSIGNDIVIDE 
                  | ASSIGNTIMES
                  | ASSIGNMOD
                  | ASSIGNBOR 
                  | ASSIGNBAND 
                  | ASSIGNBXOR
                  | ASSIGNLOR
                  | ASSIGNLAND
                  | ASSIGNLSHIFT
                  | ASSIGNRSHIFT
                  | ASSIGNRRSHIFT
                  | ASSIGNLLSHIFT
                  | ASSIGN
  '''
  set_parse_globals(p) 

  p[0] = p[1]

def p_throw(p):
  ''' throw : THROW expr'''
  set_parse_globals(p)
  p[0] = ThrowNode(p[2])

def p_assign(p):
  ''' assign : expr cmplx_assign expr 
             | assign cmplx_assign expr
             | expr
             
  '''
  
  set_parse_globals(p)
  #print("assign")
  if len(p) == 4:
    p[0] = AssignNode(p[1], p[3], mode=p[2])
  elif len(p) == 5:
    p[0] = AssignNode(p[2], p[4], set(["var"]), mode=p[3])
  elif len(p) == 3:
    p[0] = AssignNode(p[2], ExprNode([]), set(["var"]))
  else:
    p[0] = p[1]

def p_exprlist(p):
  r'''exprlist : expr
  '''
  set_parse_globals(p)

  p[0] = p[1]
  if type(p[0]) != ExprListNode:
    if type(p[0]) == ExprNode:
      p[0] = ExprListNode(p[0])
    else:
      p[0] = ExprListNode([p[0]])
  
  return
  
  r'''
  
    exprlist : expr_no_list
             | exprlist COMMA expr_no_list
  '''
  
  #'''
  #  exprlist : expr
  #           | id ASSIGN expr
  #           | exprlist COMMA expr
  #           | exprlist COMMA id ASSIGN expr
  #'''
  
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
    if type(p[0]) != ExprListNode:
      p[0] = ExprListNode([p[0]])
  elif len(p) == 4:
    p[0] = p[1]
    p[1].add(p[3])
  elif len(p) == 6:
    p[0] = p[1]
    p[0].add(AssignNode(p[3], p[5]))

"""
typedclasses are kindof like c structors or c++ objects.
their a bit different from harmony classes, which are also
supported.
"""

def p_typed_class(p):
    '''typed_class : TYPED CLASS id template_opt typed_class_tail
    '''
    set_parse_globals(p)
    
    if p[5][0] != None:
      parent = p[5][0]
    else:
      parent = None

    name = p[3].val
    
    p[0] = TypedClassNode(name, parent)
    for c in p[5][1]:
      p[0].add(c)
    
def p_typed_class_tail(p):
  '''typed_class_tail : typed_inherit_opt LBRACKET typed_class_body_opt RBRACKET
  '''
  set_parse_globals(p)
  p[0] = [p[1], p[3]]
  
def p_typed_class_body_opt(p):
  '''typed_class_body_opt : typed_class_list
                          |
  '''
  set_parse_globals(p)
  if len(p) == 2: p[0] = p[1]
    
def p_typed_class_list(p):
  '''typed_class_list : typed_class_element
                      | typed_class_list typed_class_element
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = StatementList()
    c = p[1]
  else:
    p[0] = p[1]
    c = p[2]
  
  if type(c) == VarDeclNode:
    #unnest var decl nodes
    p[0].add(c)
    
    while len(c) > 2:
      c2 = c[2]
      c.remove(c2)
      p[0].add(c2)
  else:
    p[0].add(c)
    
def p_typed_class_element(p):
  '''typed_class_element : class_element
                         | var_decl_with_arr SEMI
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_typed_inherit_opt(p):
  '''typed_inherit_opt : EXTENDS id
                       |
  '''
  set_parse_globals(p)

  if len(p) == 3:
    p[0] = p[2].val
  else:
    p[0] = None

def p_enum(p):
    '''enum : ENUM ID LBRACKET enum_body RBRACKET'''
    p[0] = EnumNode(name=p[2])
    for c in p[4][:]:
        p[0].add(c)


def p_enum_body(p):
    '''enum_body : enum_memberlist comma_opt
                 |
    '''
    if len(p) == 1:
        p[0] = ExprListNode()
    else:
        p[0] = p[1]

def p_enum_memberlist(p):
    '''enum_memberlist : enum_member
                       | enum_memberlist COMMA enum_member
    '''
    if len(p) == 2:
        p[0] = ExprListNode()
        if type(p[1]) == IdentNode:
            p[1] = AssignNode(p[1], NumLitNode(0))
        p[0].add(p[1])
    elif len(p) == 4:
        p[0] = p[1]
        if type(p[3]) == IdentNode:
            p[3] = AssignNode(p[3], NumLitNode(len(p[0])))
        p[0].add(p[3])

def p_enum_member(p):
    '''enum_member : id_no_enum
                   | id_no_enum ASSIGN expr_no_list
    '''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = AssignNode(p[1], p[3])


def p_iface_extends(p):
  '''iface_extends : EXTENDS id
                   | iface_extends COMMA id
                   |
  '''
  if len(p) == 3:
    p[0] = [p[2]]
  elif len(p) == 4:
    p[0] = p[1]
    p[0].append(p[3])
  else:
    p[0] = []

def p_iface_method(p):
  ''' iface_method : push_scope id template_opt LPAREN funcdeflist RPAREN func_type_opt SEMI
  '''

  set_parse_globals(p)

  name = p[2].val

  p[0] = FunctionNode(p[2], glob.g_line)
  p[0].add(p[5])
  p[0].add(StatementList())
  p[0].is_native = True

  if p[7] != None:
    p[0].type = p[7]
    if type(p[0].type) == str:
      p[0].type = TypeRefNode(p[0].type)

  if p[3] != None:
    p[0].template = p[3]

  pop_scope()

def p_iface_item(p):
  '''
    iface_item : typescript_class_property
               | iface_method

  '''
  p[0] = p[1]

def p_iface_body(p):
  '''iface_body : iface_item
                | iface_body iface_item
                |
  '''
  if len(p) == 2:
    p[0] = StatementList()
    p[0].add(p[1])
  elif len(p) == 3:
    p[0] = p[1]
    p[0].add(p[2])
  else:
    p[0] = StatementList()

def p_iface_tail(p):
  '''iface_tail : LBRACKET iface_body RBRACKET'''
  p[0] = p[2]

#flow-style interface
def p_interface(p):
  '''interface : INTERFACE id iface_extends iface_tail'''
  #ignore for now

  p[0] = VarDeclNode(IdentNode("undefined"), name=p[2])
  p[0].modifiers.add("local")

#page 239 of january2014 draft harmony spec (page 257 as chrome sees it)
def p_class(p):
  '''class : CLASS id template_opt class_tail'''
  set_parse_globals(p)
   
  tail = p[4]
  heritage = tail[0]

  cls = ClassNode(p[2].val, heritage)
  cls.line = p[2].line

  for n in tail[1]:
    cls.add(n)
  
  p[0] = cls;
  if p[3] != None:
    p[0].template = p[3]
    p[0].type = p[3]
  
def p_exprclass(p):
  '''exprclass : CLASS id template_opt class_tail'''
  set_parse_globals(p)

  tail = p[4]
  heritage = tail[0]
  cls = ClassNode(p[2].val, heritage)

  for n in tail[1]:
    cls.add(n)

  p[0] = cls;
  if p[3] != None:
    p[0].template = p[3];

def p_class_tail(p):
  '''class_tail : class_heritage_opt LBRACKET class_body_opt RBRACKET'''
  set_parse_globals(p)
  
  p[0] = [p[1], p[3]]
  
  for i in range(2):
    if p[0][i] == None:
      p[0][i] = []

def p_class_parent_id(p):
  '''class_parent_id : var_type
                     | class_parent_id DOT var_type
  '''

  if len(p) == 2:
    p[0] = p[1];
  else:
    p[0] = BinOpNode(p[1], p[3], ".")

def p_dot_expr(p):
  '''dot_expr : id
              | id DOT dot_expr
  '''
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = BinOpNode(p[1], p[3], ".")

def p_class_parent_call(p):
  '''class_parent_call : dot_expr func_call
                       | dot_expr
  '''

  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = p[2]
    p[0].insert(0, p[1])

def p_class_list(p):
  '''class_list : class_parent_id
                | class_parent_call
                | class_list COMMA class_parent_id
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = [p[1]];
  else:
    p[0] = p[1];
    if type(p[0]) != list:
      p[0] = [p[0]]
    p[0].append(p[3])
    
def p_class_heritage(p):
  '''class_heritage : EXTENDS class_list'''
  set_parse_globals(p)
  
  p[0] = p[2]
  if len(p[0]) > 1:
    raiseSyntaxError(p[0], "Multiple inheritance was removed from final ES6 spec")

def p_class_heritage_opt(p):
  '''class_heritage_opt : class_heritage
                        | 
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = p[1]
  
def p_class_body_opt(p):
  '''class_body_opt : class_element_list
                    |
  '''
  set_parse_globals(p)
 
  if len(p) == 1:
    p[0] = []
  else:
    p[0] = p[1]
    
  if p[0] == None: 
    p[0] = []

def p_class_element_list(p):
  '''class_element_list : class_element
                        | class_element_list class_element
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = [p[1]]
  else:
    p[0] = p[1]
    p[0].append(p[2])

def p_class_element(p):
  '''class_element : method_def
                   | typescript_class_property
  '''
#
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = p[1]
  
def p_prefix_opt(p):
  '''prefix_opt : STATIC
                | GET
                | SET
                |
  '''
  set_parse_globals(p)

  if len(p) == 2:
    p[0] = p[1]

def p_id_right(p):
  '''id_right : id %prec UMINUS
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_property_id(p):
  ''' property_id : ID
                  | GET
                  | SET
                  | DELETE
                  | FOR
                  | WHILE
                  | CATCH
                  | TRY
                  | THROW
                  | DO
                  | FINALLY
                  | NUMBER
                  | IF
                  | ENUM
                  | ELSE
                  | VAR
                  | CONST
                  | LET
                  | STATIC
                  | YIELD
                  | FUNCTION
                  | RETURN
                  | LSBRACKET expr RSBRACKET
  '''
  set_parse_globals(p)

  if len(p) == 3 and p[1] == "#":
    p[0] = p[1] + p[2]
  elif len(p) == 4:
    p[0] = RuntimeObjectKey(p[2])
  else:
    p[0] = p[1]
    if type(p[0]) == int:
        p[0] = str(p[0])

def p_property_id_right(p):
  '''property_id_right : property_id %prec UMINUS
  '''
  set_parse_globals(p)
  p[0] = p[1]

def p_property_id_opt(p):
    '''property_id_opt : property_id property_id
                       | property_id
    '''
    set_parse_globals(p)
    
    if len(p) == 2:
        p[0] = [None, p[1]]
    else:
        p[0] = [p[1], p[2]]
        
def p_star_opt(p):
  '''star_opt : TIMES
              |
  '''
  set_parse_globals(p)

  if len(p) == 2:
    p[0] = IdentNode("+"+p[1])
  else:
    p[0] = None


def p_method(p):
  '''method : star_opt property_id_opt LPAREN funcdeflist RPAREN func_type_opt LBRACKET statementlist_opt RBRACKET
  '''
  set_parse_globals(p)
  
  p2 = p[:2] + p[2] + p[3:]
  
  name = p2[3]
  params = p2[5]
  statementlist = p2[9]
  
  if statementlist == None:
    statementlist = StatementList()
  
  p[0] = MethodNode(name)
  
  if p2[2] in ["get", "set"] and p2[1] is not None:
    raiseSyntaxError(p2[1], "getter/setter generators not supported by JS")
  
  if p2[2] == "static":
    p[0].is_static = True
  elif p2[2] == "get":
    p[0] = MethodGetter(name)
    if len(params) > 0:
      raiseSyntaxError(params, "getters must have no parameters")
  elif p2[2] == "set":
    p[0] = MethodSetter(name)
    if len(params) != 1:
      raiseSyntaxError(params, "setters must one parameter")
  elif p2[2] is not None:
      raiseSyntaxError(params, "expected method, getter or setter")
    
  if p2[1] is not None:
    p[0].is_generator = True

  #clear any weird children subclasses of FunctionNode have made
  for c in p[0][:]:
    p[0].remove(c)
    
  p[0].add(params)  
  p[0].add(statementlist)
  
  if p[6] != None:
    p[0].type = p[6]

def p_getset_id(p):
  '''getset_id : property_id
               | NUMBER
  '''
  set_parse_globals(p)

  p[0] = p[1]
    
def p_method_def(p):
  '''method_def : method
  '''

  set_parse_globals(p)
  p[0] = p[1]

def p_method_def_error(p):
  '''method_def_error : method error
  '''

  set_parse_globals(p)
  p[0] = p[1]

#"""
def p_static(p):
    '''static : STATIC'''
    p[0] = p[1]

def p_cls_prefix(p):
  ''' cls_prefix : STATIC
                 | CLASS_PROP_PRIVATE
                 | CLASS_PROP_PUBLIC
  '''
  p[0] = p[1]
    
def p_cls_prefix_opt(p):
  '''cls_prefix_opt : cls_prefix
                    |
  '''
  if len(p) > 1:
    p[0] = p[1]

def p_prop_id_vartype_opt(p):
  '''prop_id_vartype_opt : ID_COLON COLON var_type
                         | ID
  '''
  if len(p) == 4:
    p[0] = [p[1], p[2]]
  else:
    p[0] = [p[1], None]
    
def p_typescript_class_property(p):
    '''typescript_class_property : CLASS_PROP_PRE cls_prefix_opt prop_id_vartype_opt ASSIGN expr_for_arraylit SEMI
                                 | CLASS_PROP_PRE cls_prefix_opt ID_COLON COLON var_type SEMI
    '''
    set_parse_globals(p)

    if len(p) == 7 and type(p[3]) != list: #check that p[3] wasn't from prop_id_vartype_opt
        p[0] = ClassPropNode(p[3], type1=p[5])
        if p[2] is not None:
            p[0].modifiers = set([p[2]])
    elif len(p) == 7:
        p[0] = ClassPropNode(p[3][0], type1=p[3][1])
        if p[2] is not None:
            p[0].modifiers = set([p[2]])
        p[0].add(p[5])

#"""

#right associativity! that's how you do c-style type
#declarations and not have var_type eat up all the id tokens!
def p_var_element(p):
  '''
    var_element : id %prec VAR_TYPE_PREC
                | SHORT %prec VAR_TYPE_PREC
                | DOUBLE %prec VAR_TYPE_PREC
                | CHAR %prec VAR_TYPE_PREC
                | BYTE %prec VAR_TYPE_PREC
                | id template_ref %prec VAR_TYPE_PREC
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
  elif len(p) == 3:
    pn = IdentNode(p[1]) if not isinstance(p[1], IdentNode) else p[1]
    
    p[0] = p[2]
    p[0].add(pn)
    p[0].name_expr = pn

def p_var_type2(p):
  '''
      var_type2 : var_element
             
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
    if p[0] in ["int", "short", "float", "double", "char", "byte"]:
      p[0] = BuiltinTypeNode(p[0])
    else:
      p[0] = TypeRefNode(p[0])

def p_class_property(p):
  '''class_property : var_type2 id
                    | class_property ASSIGN expr
                    | class_property COMMA id
                    | class_property COMMA id ASSIGN expr
  '''
  set_parse_globals(p)
  
  if len(p) == 3:
    p[0] = VarDeclNode(ExprNode([]), name=p[2])
    
    p[0].add(ExprNode([]));
    p[0].type = p[0][1]
  elif len(p) == 4 and p[2] == "=":
    p[0] = p[1]
    if len(p[1][0]) == 0 and type(p[1][0]) == ExprNode:
      p[1].replace(p[1][0], p[3])
    else:
      p[1].replace(p[1][0], AssignNode(p[1][0], p[3]))
  elif len(p) == 4 and p[2] == ",":
    if type(p[3]) == IdentNode:
      p[3] = p[3].val
    
    if type(p[3]) == str:
      n = p[1].copy()
      n.children = [ExprNode([]), n.type];
      
      n.val = p[3] if not isinstance(p[3], IdentNode) else p[3].val
      scope_add(n.val, n)
      p[3] = n
      
    p[0] = p[1]
    p[0].add(p[3])
  elif len(p) == 6 and p[2] == ",":
    if type(p[3]) == IdentNode:
      p[3] = p[3].val
    
    if type(p[3]) == str:
      n = p[1].copy()
      n.children = [ExprNode([]), n.type];
      
      n.val = p[3] if not isinstance(p[3], IdentNode) else p[3].val
      scope_add(n.val, n)
      p[3] = n
    
    p[3].replace(p[3][0], p[5]);
    
    p[0] = p[1]
    p[0].add(p[3])
    
def p_setter_param_list(p):
  '''
    setter_param_list : var_type_opt id
                      | var_type
  '''
  set_parse_globals(p)
  
  if len(p) == 3 and p[1] != None:
    p[0] = ExprListNode([VarDeclNode(ExprNode([]), name=p[2])])
    n = p[0][0]
    n.type = p[1]
    if len(n) > 1:
      n.replace(n[1], n.type)
    else:
      n.add(n.type)
  else:
    if type(p[1]) not in [IdentNode, VarDeclNode]:
      raiseSyntaxError(p[1], "Invalid variable declaration")
    
    p[0] = ExprListNode([p[1]])
    

def p_template_ref_opt(p):
  '''template_ref_opt : template_ref
                      |
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = p[1]
    
def p_func_call(p):
  r''' func_call : template_ref_opt LPAREN exprlist RPAREN
                 | template_ref_opt LPAREN RPAREN
  '''
  set_parse_globals(p)
  
  if len(p) == 5:
    elist = p[3]
  elif len(p) == 4:
    elist = ExprNode([])

  p[0] = FuncCallNode(elist)
  if p[1] != None:
    p[0].template = p[1]
  

#this is nearly identical to exprlist; it is identical on the action side
def p_funcdeflist(p):
  r'''
    funcdeflist : var_decl_no_list
                | funcdeflist COMMA var_decl_no_list
                | typed_argument
                | funcdeflist COMMA typed_argument
                |
  '''
  
  
  set_parse_globals(p)
  
  if len(p) == 1:
    p[0] = ExprListNode([])
  elif len(p) == 2:
    p[0] = ExprListNode([p[1]])
  elif len(p) == 4:
    if type(p[1]) == ExprListNode:
      p[0] = p[1]
      p[1].add(p[3])
    else:
      p[0] = ExprListNode([AssignNode(p[1], p[3])])

def p_template_opt(p):
  '''template_opt : template
                  |
  '''
  set_parse_globals(p)
  if len(p) == 1:
    p[0] = None
  else:
    p[0] = p[1]

def p_func_type_opt(p):
  ''' func_type_opt : COLON var_type_opt 
                    |
  '''
  set_parse_globals(p)
  if len(p) > 1:
    p[0] = p[2]
  else:
    p[0] = None
   
def p_funcref(p):
  ''' funcref : FUNCTION star_opt id template_opt push_scope LPAREN funcdeflist RPAREN func_type_opt
  '''
  
  set_parse_globals(p)
  
  name = p[3]
  
  p[0] = FuncRefNode(name)
  p[0].add(p[7])
  p[7].flatten()
  
  if p[9] != None:
    p[0].type = p[9]
    if type(p[0].type) == str:
      p[0].type = TypeRefNode(p[0].type)
      
  if p[4] != None:
    p[0].template = p[4]
  pop_scope()
  
def p_func_native(p):
  ''' func_native : NATIVE push_scope FUNCTION id template_opt LPAREN funcdeflist RPAREN func_type_opt
  '''
  
  set_parse_globals(p)
  
  name = p[4].val
  
  p[0] = FunctionNode(p[4], glob.g_line)
  p[0].add(p[7])
  p[0].add(StatementList())
  p[0].is_native = True
  
  if p[9] != None:
    p[0].type = p[9]
    if type(p[0].type) == str:
      p[0].type = TypeRefNode(p[0].type)
      
  if p[5] != None:
    p[0].template = p[5]
  
  pop_scope()
    
def p_function(p):
  ''' function : FUNCTION star_opt id template_opt push_scope LPAREN funcdeflist RPAREN func_type_opt LBRACKET statementlist_opt RBRACKET
  '''
  
  set_parse_globals(p)
  
  name = p[3].val
  exprlist = p[11]
  params = p[7]
  params.flatten()
    
  p[0] = FunctionNode(name, p.lineno)
  p[0].add(params)
  for c in exprlist:
    p[0].add(c)
  
  p[0].is_generator = p[2] is not None
  
  if p[9] != None:
    p[0].type = p[9]
    if type(p[0].type) == str:
      p[0].type = TypeRefNode(p[0].type)
      
  if p[4] != None:
    p[0].template = p[4]
  
  pop_scope()
  
def p_lbracket_restrict(p):
  '''lbracket_restrict : LBRACKET'''
  set_parse_globals(p, last_restrict_str())
  
  p[0] = p[1]
  push_restrict(p, val=False)
  
def p_rbracket_restrict(p):
  '''rbracket_restrict : RBRACKET'''
  set_parse_globals(p)
  p[0] = p[1]
  pop_restrict()

def p_var_type_opt(p):
  '''var_type_opt : var_type
                  |
  '''
  if len(p) == 2:
    p[0] = p[1]

def p_colon_opt(p):
  ''' colon_opt : COLON
                |
  '''
  if len(p) == 2:
    p[0] = p[1]
    
def p_func_name_opt(p):
  ''' func_name_opt : ID
                    | SET
                    | GET
                    | SHORT
                    | DOUBLE
                    | TYPED
                    |
  '''
  if len(p) == 1:
    p[0] = "(anonymous)"
  else:
    p[0] = p[1]

def p_func_name(p):
  ''' func_name     : ID
                    | SET
                    | GET
                    | SHORT
                    | DOUBLE
                    | TYPED
  '''
  
  p[0] = p[1];
 
def p_exprfunction(p):
  ''' exprfunction : FUNCTION star_opt func_name_opt template_opt push_scope LPAREN funcdeflist RPAREN colon_opt var_type_opt lbracket_restrict statementlist_opt rbracket_restrict
                   | FUNCTION star_opt func_name_opt template_opt push_scope LPAREN RPAREN colon_opt var_type_opt lbracket_restrict statementlist_opt rbracket_restrict
  '''
  
  set_parse_globals(p)
  
  colon = None
  type1 = None
  template = None
  
  if len(p) == 14:
    p[0] = FunctionNode(p[3], p.lineno)
    p[0].is_anonymous = True
    p[0].add(p[7])
    p[0].is_generator = p[2] is not None
    p[7].flatten()

    colon = p[9]
    type1 = p[10]
    template = p[4]
    
    for c in p[12].children:
      p[0].add(c)
  else:
    p[0] = FunctionNode(p[3], p.lineno)
    p[0].is_anonymous = True
    p[0].add(ExprNode([]))
    p[0].is_generator = p[2] is not None
    
    colon = p[8]
    type1 = p[9]
    template = p[4]
    
    for c in p[11].children:
      p[0].add(c)
    
  if type(p[0].type) == str:
    p[0].type = TyperefNode(p[0].type)
      
  if type1 != None and colon == None:
    glob.g_error = True
    glob.g_error_pre = p
    print_err(p, False)
    raiseSyntaxError(p[3], "Expected ':'")
    
  if template != None:
    p[0].template = template
  p[0].type = type1
  
  pop_scope()


def p_comma_opt(p):
  '''comma_opt : COMMA
               |
  '''
  
def p_expr_for_arraylit(p):
  '''expr_for_arraylit : expr_no_list
                       | obj_literal
  '''
  set_parse_globals(p)
  p[0] = p[1]
  
def p_arraylist(p):
  '''arraylist : expr_for_arraylit
               | arraylist expr_for_arraylit
               | arraylist arrow_function
               | arraylist COMMA
  '''
  
  if len(p) == 3:
    if p[2] != ",":
      if not isinstance(p[1], ExprListNode):
        p[0] = ExprListNode([])
        p[0].add(p[1])
      else:
        p[0] = p[1]
      p[0].add(p[2])
    else:
      p[0] = p[1]
  elif len(p) == 2:
    p[0] = ExprListNode([p[1]])
    
def p_array_literal(p):
  '''array_literal : LSBRACKET arraylist RSBRACKET
                   | LSBRACKET RSBRACKET
  '''
  set_parse_globals(p)
  if len(p) == 4:
    p[0] = ArrayLitNode(p[2])
  else:
    p[0] = ArrayLitNode(ExprListNode([]))

def p_id_str_or_num(p):
  '''id_str_or_num : id
               | NUMBER
               | STRINGLIT
  '''
  
  set_parse_globals(p)
  
  if type(p[1]) == StringLit:
    p[0] = StrLitNode(p[1])
  elif type(p[1]) == str:
    p[0] = IdentNode(p[1])
  elif type(p[1]) == IdentNode:
    p[0] = p[1]
  else:
    p[0] = NumLitNode(p[1])

def p_typeof(p):
  r'''typeof : TYPEOF expr
  '''
  p[0] = TypeofNode(p[2])
  
def p_typeof_no_list(p):
  r'''typeof_no_list : TYPEOF expr_no_list
  '''
  p[0] = TypeofNode(p[2])

def p_objlit_key(p):
    r'''
      objlit_key : id_str_or_num
                 | ID_COLON
                 | NEW
                 | CATCH
                 | TRY
                 | FINALLY
                 | THROW
                 | LSBRACKET expr RSBRACKET
                 | CLASS_PROP_PRE objlit_key
    '''

    if len(p) == 2:
        p[0] = p[1]
    elif len(p) == 3:
        p[0] = p[2]
    else:
        p[0] = RuntimeObjectKey(p[2])

def p_obj_lit_list(p):
  r'''
    obj_lit_list : objlit_key COLON expr
                 | TRIPLEDOT id
                 | id
                 | objlit_function
                 | obj_lit_list COMMA objlit_function
                 | obj_lit_list COMMA objlit_key COLON expr
                 | obj_lit_list COMMA id
                 | obj_lit_list COMMA
                 | obj_lit_list COMMA TRIPLEDOT ID
  '''
  
  set_parse_globals(p)

  if len(p) == 2 and type(p[1]) == IdentNode:
    p[0] = ObjLitNode()
    p[0].add(AssignNode(p[1], p[1].copy()))
  elif len(p) == 4 and type(p[3]) == IdentNode and p[2] != ":":
    p[0] = p[1]
    p[0].add(AssignNode(p[3], p[3].copy()))
  elif len(p) == 2:
    p[0] = ObjLitNode()

    if type(p[1]) == ObjLitSetGet or type(p[1]) == BindingArg:
      p[0].add(p[1])
    else:
      p[0].add(AssignNode(IdentNode(p[1].name), p[1]))
  elif len(p) == 4 and p[2] == ":":
    p[0] = ObjLitNode()
    p[0].add(AssignNode(p[1], p[3]))
  elif len(p) == 4:
    p[0] = p[1]
    if type(p[3]) == ObjLitSetGet:
      p[0].add(p[3])
    else:
      p[0].add(AssignNode(IdentNode(p[3].name), p[3]))
  elif len(p) == 3:
    if p[1] == '...':
        p[0] = ObjLitNode()
        p[0].add(BindingArg(p[2]))
    else:
        p[0] = p[1]
  elif len(p) == 5:
    p[0] = p[1]
    p[0].add(BindingArg(p[4]))
  elif len(p) == 6:
    p[0] = p[1]
    p[0].add(AssignNode(p[3], p[5]))

def p_obj_literal(p):
  '''obj_literal : lbracket_restrict push_scope obj_lit_list rbracket_restrict
                    | lbracket_restrict rbracket_restrict
  '''
  set_parse_globals(p)
  if len(p) == 5:
    p[0] = p[3]
  else:
    p[0] = ObjLitNode()
  
  pop_scope()
  
def p_star_opt_2(p):
  '''star_opt_2 : 
                 | TIMES
  '''
  
  if len(p) == 2:
    p[0] = p[1]
    
def p_objlit_function(p):
  ''' objlit_function : TIMES func_name LPAREN funcdeflist RPAREN lbracket_restrict statementlist_opt rbracket_restrict
                      | func_name LPAREN funcdeflist RPAREN lbracket_restrict statementlist_opt rbracket_restrict
                      | GET func_name LPAREN funcdeflist RPAREN lbracket_restrict statementlist_opt rbracket_restrict
                      | SET func_name LPAREN funcdeflist RPAREN lbracket_restrict statementlist_opt rbracket_restrict
  '''
  
  set_parse_globals(p)
  
  colon = None
  type1 = None
  template = None
  
  if len(p) == 9 and p[1] == "*":
    p[0] = FunctionNode(p[2], p.lineno)
    p[0].add(p[4])
    
    for c in p[7]:
      p[0].add(c)
    
    p[0].is_generator = True
  elif len(p) == 9 and p[1] in ["get", "set"]:
    fn = FunctionNode(p[2], p.lineno)
    fn.add(p[4])
    for c in p[7]:
      fn.add(c)

    p[0] = ObjLitSetGet(p[2], fn, p[1])
  else:
    p[0] = FunctionNode(p[1], p.lineno)
    p[0].add(p[3])
    
    for c in p[6]:
      p[0].add(c)
    
  pop_scope()

def p_delete(p):
  '''delete : DELETE expr
  '''
  
  set_parse_globals(p)
  p[0] = DeleteNode(p[2])
  
def p_new(p):
  '''new : NEW expr
  '''
  set_parse_globals(p)
  p[0] = KeywordNew(p[2])
  
def p_new_no_list(p):
  '''new_no_list : NEW expr_no_list
  '''
  set_parse_globals(p)
  p[0] = KeywordNew(p[2])

def p_inc_no_list(p):
  '''inc_no_list : expr_no_list INC
                 | INC expr_no_list
  '''
  set_parse_globals(p)
  if p[1] == "++":
    p[0] = PreInc(p[2]);
  else:
    p[0] = PostInc(p[1])
    
def p_dec(p):
  '''dec : expr DEC
         | DEC expr
  '''

  set_parse_globals(p)
  if p[1] == "--":
    p[0] = PreDec(p[2]);
  else:
    p[0] = PostDec(p[1])

def p_not(p):
  '''not : NOT expr'''
  set_parse_globals(p)
  p[0] = LogicalNotNode(p[2])

def p_inc(p):
  '''inc : expr INC
         | INC expr
  '''
  set_parse_globals(p)
  if p[1] == "++":
    p[0] = PreInc(p[2]);
  else:
    p[0] = PostInc(p[1])
    
def p_dec_no_list(p):
  '''dec_no_list : expr_no_list DEC
                 | DEC expr_no_list
  '''

  set_parse_globals(p)
  if p[1] == "--":
    p[0] = PreDec(p[2]);
  else:
    p[0] = PostDec(p[1])

def p_not_no_list(p):
  '''not_no_list : NOT expr_no_list'''
  set_parse_globals(p)
  p[0] = LogicalNotNode(p[2])
  
def p_bitinv_no_list(p):
  '''bitinv_no_list : BITINV expr_no_list'''
  set_parse_globals(p)
  p[0] = BitInvNode(p[2])

def p_bitinv(p):
  '''bitinv : BITINV expr'''
  set_parse_globals(p)
  p[0] = BitInvNode(p[2])
  
def p_strlit(p):
  '''strlit : STRINGLIT'''
  set_parse_globals(p)
  p[0] = StrLitNode(p[1])

def p_lparen_restrict(p):
  ''' lparen_restrict : LPAREN
  '''
  set_parse_globals(p, last_restrict_str())
  p[0] = p[1]
  
  push_restrict(p)
  
def p_rparen_restrict(p):
  ''' rparen_restrict : RPAREN
  '''
  set_parse_globals(p)
  p[0] = p[1]
  
  pop_restrict()

def p_lsbracket_restrict(p):
  ''' lsbracket_restrict : LSBRACKET
  '''
  set_parse_globals(p, last_restrict_str())
  p[0] = p[1]
  
  push_restrict(p)
  
def p_rsbracket_restrict(p):
  ''' rsbracket_restrict : RSBRACKET
  '''
  set_parse_globals(p)
  p[0] = p[1]
  
  pop_restrict()

def p_concise_body(p):
  '''concise_body : expr_no_list
                  | LBRACKET statementlist_opt RBRACKET
                    
  '''
  set_parse_globals(p)
  
  if len(p) == 2:
    p[0] = ReturnNode(p[1])
  else:
    p[0] = p[2]


def p_id_colon2(p):
  '''id_colon2 : ID_COLON
               | id
               | CLASS_PROP_PRE ID_COLON
  '''
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = p[2]

def p_typed_argument(p):
  '''
  typed_argument : id_colon2
                 | id_colon2 COLON var_type
                 | id_colon2 COLON FUNCTION
                 | id_colon2 COLON var_type ASSIGN expr_for_arraylit
                 | id_colon2 COLON FUNCTION ASSIGN expr_for_arraylit
                 | id_colon2 ASSIGN expr_for_arraylit
  '''
  set_parse_globals(p)

  if len(p) == 2:
    p[0] = VarDeclNode(name=p[1].val)
  elif len(p) == 4 and p[2] == ":":
    p[0] = VarDeclNode(ExprNode(), name=p[1])
    p[0].type = p[3]
  elif len(p) == 4 and p[2] == "=":
    p[0] = VarDeclNode(p[3], name=p[1])
  elif len(p) == 6:
    p[0] = VarDeclNode(p[5], name=p[1])
    p[0].type = p[3]


def p_arrowparamlist_opt(p):
  '''arrowparamlist_opt : typed_argument
                        | arrowparamlist_opt COMMA typed_argument
                        |
  '''
#todo: support rest parameters
#                       | arrowparamlist_opt TRIPLEDOT
#                       | TRIPLEDOT arrowparamlist_opt

  set_parse_globals(p)
  
  if len(p) == 1:
    p[0] = ExprListNode([])
  elif len(p) == 2:
    p[0] = ExprListNode([])
    p[0].add(p[1])
  elif len(p) == 4:
    p[0] = p[1]
    if p[0] == None:
      p[0] = ExprListNode([])
    p[0].add(p[3])
  else:
    raise RuntimeError("eek!")

def p_arrow_function(p):
  '''
    arrow_function : ARROW_PRE arrowparamlist_opt RPAREN ARROW concise_body
                   | ARROW_PRE arrowparamlist_opt RPAREN COLON var_type ARROW concise_body
                   | ID ARROW concise_body
  '''
  
  func = FunctionNode("(anonymous)")
  func.is_anonymous = True
  func.is_arrow = True

  if len(p) == 8:
    func.add(p[2])
    func.add(p[7])
    func.type = p[5]
  elif len(p) == 4:
    func.add(ExprListNode([p[1]]))
    func.add(p[3])
  else:
    if p[2] is None:
      p[2] = ExprListNode([])
      
    func.add(p[2])
    func.add(p[5])
    
  p[0] = func
  return
  
  '''arrow_function : expr ARROW expr_no_list
                    | LPAREN arrowparamlist_opt RP_ARROW expr_no_list
                    | expr ARROW_LB statementlist_opt RBRACKET
                    | LPAREN expr RP_ARROW_LB statementlist_opt RBRACKET
  '''
  
  set_parse_globals(p)

  #arrowparamlist_opt
  
  p[0] = FunctionNode("(anonymous)")
  p[0].is_anonymous = p[0].is_arrow = True
  
  if len(p) == 4:
    p[0].add(p[1])
    p[0].add(p[3])
  elif len(p) == 5 and p[1] == '(':
    p[0].add(p[2])
    p[0].add(p[4])
    #pop_restrict(')')
  elif len(p) == 5:
    p[0].add(p[1])
    p[0].add(p[3])
  elif len(p) == 6:
    p[0].add(p[2])
    p[0].add(p[4])
    #pop_restrict(')')

def p_id_colon(p):
    '''id_colon : ID_COLON'''
    p[0] = IdentNode(p[1])

def p_member_name(p):
  '''member_name : ID
                 | NEW
                 | TRY
                 | DELETE
                 | FINALLY
                 | THROW
                 | RETURN
                 | CATCH'''
  if len(p) == 3:
    p[0] = IdentNode(p[1] + p[2])
  else:
    p[0] = IdentNode(p[1])

def p_expr(p):
    '''expr : NUMBER
            | strlit
            | id
            | TRIPLEDOT id
            | id_colon
            | id template_ref
            | template_ref
            | array_literal
            | arrow_function
            | exprfunction
            | exprclass
            | obj_literal
            | dynamic_import
            | expr cmplx_assign expr
            | expr cmplx_assign expr COLON var_type SEMI
            | expr RSHIFT expr
            | expr LSHIFT expr
            | expr EXPONENT expr
            | expr DOUBLEQ expr
            | expr LLSHIFT expr
            | expr RRSHIFT expr
            | expr COND_DOT expr
            | expr DOT expr
            | expr DOT member_name
            | expr DOT DELETE
            | expr DOT DEFAULT
            | expr LAND expr
            | expr LOR expr
            | expr BOR expr
            | expr INSTANCEOF expr
            | expr BXOR expr
            | expr BAND expr
            | expr EQUAL expr
            | expr EQUAL_STRICT expr
            | expr NOTEQUAL_STRICT expr
            | expr GTHAN expr
            | expr GTHANEQ expr
            | expr LTHAN expr
            | expr MOD expr
            | expr LTHANEQ expr
            | expr NOTEQUAL expr
            | expr PLUS expr
            | expr MINUS expr
            | expr DIVIDE expr
            | expr TIMES expr
            | expr IN expr
            | expr func_call
            | expr lsbracket_restrict expr rsbracket_restrict
            | expr QEST expr COLON expr
            | expr COMMA expr
            | lparen_restrict expr rparen_restrict
            | expr_uminus
            | expr_uplus
            | not
            | bitinv
            | new
            | inc
            | dec
            | typeof
            | re_lit
    '''
    set_parse_globals(p)

    if len(p) == 3 and p[1] == "...":
      p[0] = BindingArg(p[2])
      return

    if len(p) == 7:
      if p[2] != "[": #assignment
        p[0] = AssignNode(p[1], p[3], p[2])
        p[0].type = p[5]
    elif len(p) == 6: #trinary conditional expressions or assignment with type
      if p[2] != "?": #assignment
        p[0] = AssignNode(p[1], p[3], p[2])
        p[0].type = p[5]
      else:
        p[0] = TrinaryCondNode(p[1], p[3], p[5]);
    if len(p) == 5: #assignment ops and array lookups
      p[0] = ArrayRefNode(p[1], p[3])
    elif len(p) == 4:
      if p[3] == "delete":
        p[3] = IdentNode("delete")
        
      if p[1] == '(' and p[3] == ')':
        p[0] = ExprNode([p[2]], add_parens=True)
      elif type(p[2]) == str and p[2].startswith("=") \
           and not (len(p[2]) >= 2 and p[2][1] == "="):
        p[0] = AssignNode(p[1], p[3], p[2])
      elif p[2] == ",":
        if type(p[1]) != ExprListNode:
          p[0] = ExprListNode([p[1]])
        else:
          p[0] = p[1]
        p[0].add(p[3])
      else:
        p[0] = BinOpNode(p[1], p[3], p[2])

    elif len(p) == 3:
      if type(p[2]) == FuncCallNode:
        p[0] = p[2];
        p[0].prepend(p[1]);
      elif type(p[2]) == TemplateNode:
        p[0] = TypeRefNode(p[1])
        p[0].template = p[2]
    elif len(p) == 2:
      if type(p[1]) in [RegExprNode, FuncCallNode, StrLitNode, TypeofNode,
                        BitInvNode, LogicalNotNode, NegateNode, PositiveNode,
                        ArrayLitNode, ObjLitNode, FunctionNode, 
                        KeywordNew, PreInc, PostInc, PreDec, PostDec,
                        TemplateNode, ExprListNode, ClassNode, TypedClassNode, IdentNode, BindingArg, IdentNode]:
        p[0] = p[1]
      elif type(p[1]) in [float, int, HexInt]:
        p[0] = NumLitNode(p[1])
      elif p[1].val.startswith('"'):
        p[0] = StrLitNode(p[1])
      else:
        p[0] = IdentNode(p[1])

#no object literals either
#or type stuff.  or arrow 
#functions
def p_expr_no_list(p):
    '''expr_no_list : NUMBER
            | TRIPLEDOT id
            | strlit
            | id
            | id_colon
            | array_literal
            | exprfunction
            | exprclass
            | dynamic_import
            | expr_no_list cmplx_assign expr_no_list
            | expr_no_list RSHIFT expr_no_list
            | expr_no_list LSHIFT expr_no_list
            | expr_no_list LLSHIFT expr_no_list
            | expr_no_list RRSHIFT expr_no_list
            | expr_no_list COND_DOT expr_no_list
            | expr_no_list DOT expr_no_list
            | expr_no_list EXPONENT expr_no_list
            | expr_no_list LAND expr_no_list
            | expr_no_list LOR expr_no_list
            | expr_no_list BOR expr_no_list
            | expr_no_list INSTANCEOF expr_no_list
            | expr_no_list BXOR expr_no_list
            | expr_no_list BAND expr_no_list
            | expr_no_list EQUAL expr_no_list
            | expr_no_list EQUAL_STRICT expr_no_list
            | expr_no_list NOTEQUAL_STRICT expr_no_list
            | expr_no_list GTHAN expr_no_list
            | expr_no_list GTHANEQ expr_no_list
            | expr_no_list LTHAN expr_no_list
            | expr_no_list MOD expr_no_list
            | expr_no_list LTHANEQ expr_no_list
            | expr_no_list NOTEQUAL expr_no_list
            | expr_no_list PLUS expr_no_list
            | expr_no_list MINUS expr_no_list
            | expr_no_list DIVIDE expr_no_list
            | expr_no_list TIMES expr_no_list
            | expr_no_list IN expr_no_list
            | expr_no_list func_call
            | expr_no_list lsbracket_restrict expr rsbracket_restrict
            | expr_no_list QEST expr_no_list COLON expr_no_list
            | lparen_restrict expr rparen_restrict
            | expr_no_list_uminus
            | expr_no_list_uplus
            | not_no_list
            | bitinv_no_list
            | new_no_list
            | inc_no_list
            | dec_no_list
            | typeof_no_list
            | re_lit
    '''
    set_parse_globals(p)

    if len(p) == 7:
      if p[2] != "[": #assignment
        p[0] = AssignNode(p[1], p[3], p[2])
        p[0].type = p[5]
    elif len(p) == 6: #trinary conditional expressions or assignment with type
      if p[2] != "?": #assignment
        p[0] = AssignNode(p[1], p[3], p[2])
        p[0].type = p[5]
      else:
        p[0] = TrinaryCondNode(p[1], p[3], p[5]);
    if len(p) == 5: #assignment ops and array lookups
      p[0] = ArrayRefNode(p[1], p[3])
    elif len(p) == 4:
      if p[1] == '(' and p[3] == ')':
        p[0] = ExprNode([p[2]], add_parens=True)
      elif type(p[2]) == str and p[2].startswith("=") \
           and not (len(p[2]) >= 2 and p[2][1] == "="):
        p[0] = AssignNode(p[1], p[3], p[2])
      elif p[2] == ",":
        if type(p[1]) != ExprListNode:
          p[0] = ExprListNode([p[1]])
        else:
          p[0] = p[1]
        p[0].add(p[3])
      else:
        p[0] = BinOpNode(p[1], p[3], p[2])

    elif len(p) == 3:
      if type(p[2]) == FuncCallNode:
        p[0] = p[2];
        p[0].prepend(p[1]);
      elif type(p[2]) == TemplateNode:
        p[0] = TypeRefNode(p[1])
        p[0].template = p[2]
      elif type(p[1]) == str and p[1] == '...':
        p[0] = BindingArg(p[2])
    elif len(p) == 2:
      if type(p[1]) in [RegExprNode, FuncCallNode, StrLitNode, TypeofNode,
                        BitInvNode, LogicalNotNode, NegateNode, PositiveNode, 
                        ArrayLitNode, ObjLitNode, FunctionNode, 
                        KeywordNew, PreInc, PostInc, PreDec, PostDec,
                        TemplateNode, ExprListNode, ClassNode, TypedClassNode]:
        p[0] = p[1]
      elif type(p[1]) in [float, int, HexInt]:
        p[0] = NumLitNode(p[1])
      elif type(p[1]) == IdentNode:
        p[0] = p[1]
      elif p[1].startswith('"'):
        p[0] = StrLitNode(p[1])
      else:
        p[0] = IdentNode(p[1])


#p_expr.__doc__ = p_expr.__doc__.replace("expr", "expr") #+ "    | exprfunction \n"
#print(p_expr.__doc__)

def p_expr_uplus(p):
    '''expr_uplus : PLUS expr %prec UMINUS
    '''
    set_parse_globals(p);
    p[0] = PositiveNode(p[2]);

def p_expr_no_list_uplus(p):
    '''expr_no_list_uplus : PLUS expr_no_list %prec UMINUS
    '''
    set_parse_globals(p);
    p[0] = PositiveNode(p[2]);

def p_expr_uminus(p):
    '''expr_uminus : MINUS expr %prec UMINUS
    '''
    set_parse_globals(p);
    p[0] = NegateNode(p[2]);
    
def p_expr_no_list_uminus(p):
    '''expr_no_list_uminus : MINUS expr_no_list %prec UMINUS
    '''
    set_parse_globals(p);
    p[0] = NegateNode(p[2]);

def p_paren_expr(p):
  '''paren_expr : LPAREN expr RPAREN
                | LPAREN RPAREN
  '''
  set_parse_globals(p)
  if len(p) == 4:
    p[0] = p[2]
  else:
    p[0] = ExprNode([])
  
def p_assign_opt(p):
  '''assign_opt : assign
                 |
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = ExprNode([])
    
def p_expr_opt(p):
  '''expr_opt : expr
              |
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = ExprNode([])

def p_re_lit(p):
  '''re_lit : REGEXPR
  '''
  set_parse_globals(p);
  p[0] = RegExprNode(p[1])

def p_simple_var_decl_strict(p):
  '''
    simple_var_decl_strict : VAR id
                           | LET id
  '''
  set_parse_globals(p)
  
  p[0] = VarDeclNode(ExprNode([]), local=True)
  p[0].val = p[2] if not isinstance(p[2], IdentNode) else p[2].val
  
  if p[1] == "let":
    p[0].modifiers.add("let");
  
  p[0].add(UnknownTypeNode())
  p[0].type = p[0][1]
  #p[0].add(p[0].type)
  
  scope_add(p[0].val, p[0])
  
def p_for_var_decl(p):
  '''for_var_decl : expr_opt
                  | simple_var_decl_strict
                  | simple_var_decl_strict ASSIGN expr
  '''

  global parsescope

  set_parse_globals(p)
  
  if len(p) == 4:
    if isinstance(p[3], str):
      p[3] = IdentNode(p[3])
    
    p[1].replace(p[1][0], p[3])
    p[0] = p[1];
  else:
    p[0] = p[1]
    
  
  if type(p[1]) == str:
    if p[1] not in parsescope:
      print_err(p, msg="undeclared variable")
      raiseSyntaxError(p[1], "Undeclared Variable")
    
    p[0] = VarDeclNode(p[3] if len(p) == 4 else ExprNode([]))
    p[0].type = parsescope[p[1]].type
    p[0].val = p[1] if not isinstance(p[1], IdentNode) else p[1].val
    
    if p[0].type == None:
      p[0].type = UnknownTypeNode
    
    p[0].modifiers = set(parsescope[p[1]])
    p[0].modifiers.add("local")
    p[0].local = True
    p[0].add(p[0].type)
    
#is 'of' a reserved keyword?
#it must be, because otherwise the grammar is ambiguous
#unless I'm doing something wrong, that is
def p_in_or_of(p):
  '''in_or_of : IN
              | OF
  '''
  #if p[1] not in ["in", "of"]:
  #  raise SyntaxError()
  
  p[0] = p[1]

"""
def p_var_id(p):
  '''
    var_id : VAR id
           | LET id
  '''
  p[0] = p[2]
#"""

def p_for_of_expand(p):
  '''
  for_of_expand : type_modifiers var_expand OF expr
  '''
  set_parse_globals(p)

  p[0] = ForInNode(p[2], p[4])
  p[2].modifiers = p[1]
  p[0].of_keyword = "of"

def p_for_decl(p):
  '''
    for_decl : for_var_decl SEMI expr_opt SEMI expr_opt
             | id in_or_of expr
             | simple_var_decl in_or_of expr
             | for_of_expand
  '''
  
  set_parse_globals(p)
  if len(p) == 4:
    of_keyword = p[2]
    #if of_keyword not in ["in", "of"]:
    #  raise SyntaxError()
    
    p[0] = ForInNode(p[1], p[3])
    p[0].of_keyword = of_keyword
  elif len(p) == 2:
    p[0] = p[1];
  else:
    p[0] = ForCNode(p[1], p[3], p[5])
  
def p_loop_label_opt(p):
  '''loop_label_opt : 
                    | ID_COLON COLON
  '''
  
  if len(p) == 3:
    p[0] = p[1]

def p_for(p):
  '''for : loop_label_opt FOR LPAREN for_decl RPAREN statement_nonctrl
         | loop_label_opt FOR LPAREN for_decl RPAREN LBRACKET statementlist_opt RBRACKET
  '''

  set_parse_globals(p)
  if len(p) == 7:
    p[0] = ForLoopNode(p[4])
    p[0].add(p[6])
  else:
    p[0] = ForLoopNode(p[4])
    p[0].add(p[7])
  
  if p[1] is not None:
    p[0].label = p[1]
    
def p_ctrl_statement(p):
  """ ctrl_statement : statement_nonctrl
                     | LBRACKET statementlist_opt RBRACKET
                     | SEMI
  """
  set_parse_globals(p);

  if len(p) == 2 and p[1] != "{":
    p[0] = p[1]
  elif len(p) == 4 and p[1] == "{":
    p[0] = p[2]
  elif len(p) == 2:
    p[0] = StatementList()
  else:
    p[0] = NullStatement()

def p_dowhile(p):
  '''dowhile : loop_label_opt DO ctrl_statement WHILE paren_expr
  '''

  set_parse_globals(p)
  
  if len(p) == 6:
    p[0] = DoWhileNode(p[5])
    p[0].add(p[3])
    p[0].label = p[1]

def p_while(p):
  '''while : loop_label_opt WHILE paren_expr statement_nonctrl
           | loop_label_opt WHILE paren_expr LBRACKET statementlist_opt RBRACKET
  '''

  set_parse_globals(p)
  if len(p) == 5:
    p[0] = WhileNode(p[3])
    p[0].add(p[4])
  else:
    p[0] = WhileNode(p[3])
    p[0].add(p[5])
    
  p[0].label = p[1]
  
def p_default_case(p):
  '''default_case : DEFAULT COLON statementlist
  '''
  p[0] = DefaultCaseNode()
  p[0].add(p[3])

def p_statementlist_opt(p):
  '''statementlist_opt : statementlist
                       |
  '''
  
  set_parse_globals(p);
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = StatementList()
    
def p_case_clause(p):
  '''case_clause : CASE expr COLON statementlist_opt
  '''
  set_parse_globals(p);
  p[0] = CaseNode(p[2])
  p[0].add(p[4])
  
def p_case_clauses(p):
  '''case_clauses : case_clause
                  | case_clauses case_clause
  '''
  set_parse_globals(p);
  if len(p) == 2:
    p[0] = [p[1]]
  else:
    p[0] = p[1]
    p[1].append(p[2])
    
def p_case_clauses_opt(p):
  '''case_clauses_opt : case_clauses
                      |
  '''
  
  set_parse_globals(p);
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = None
    
def p_case_block(p):
  '''case_block : case_clauses
                | case_clauses_opt default_case case_clauses_opt
  '''
  set_parse_globals(p);
  if len(p) == 2:
    p[0] = p[1]
  elif len(p) == 4:
    if p[1] != None:
      p[0] = p[1]

      p[0].append(p[2])

      if p[3] != None:
        for n in p[3]:
          p[0].append(n)
    else:
      p[0] = [p[2]]

      if p[3] != None:
        for n in p[3]:
          p[0].append(n)
      
def p_switch(p):
  '''switch : SWITCH paren_expr LBRACKET case_block RBRACKET
  '''
  
  p[0] = SwitchNode(p[2])
  for n in p[4]:
    p[0].add(n)
  
def p_with(p):
  '''with : WITH paren_expr ctrl_statement
  '''

  set_parse_globals(p)
  p[0] = WithNode(p[2])
  p[0].add(p[3])

def p_if(p):
  '''if : IF paren_expr ctrl_statement
  '''

  set_parse_globals(p)

  p[0] = IfNode(p[2])
  p[0].add(p[3])

def p_try(p):
  '''try : TRY statement_nonctrl
         | TRY LBRACKET statementlist RBRACKET
         | TRY LBRACKET RBRACKET
  '''

  set_parse_globals(p)
  if len(p) == 3:
    p[0] = TryNode()
    if p[2] != "{":
      p[0].add(p[2])
  elif len(p) == 4:
    p[0] = TryNode()
    p[0].add(ExprListNode([]))
  else:
    p[0] = TryNode()
    p[0].add(p[3])

def p_finally(p):
  '''finally : FINALLY  LBRACKET statementlist_opt RBRACKET
  '''
  set_parse_globals(p)
  p[0] = FinallyNode()
  p[0].add(p[3]);
  
def p_export_decl(p):
  '''export_decl : EXPORT TIMES from_clause SEMI
                 | EXPORT export_clause from_clause SEMI
                 | EXPORT export_clause SEMI
                 | EXPORT var_decl SEMI
                 | EXPORT function
                 | EXPORT class
                 | EXPORT interface
                 | EXPORT enum
                 | EXPORT DEFAULT function
                 | EXPORT DEFAULT enum
                 | EXPORT DEFAULT class
                 | EXPORT DEFAULT assign
  '''
  set_parse_globals(p)

  def get_name(n):
    if isinstance(n, VarDeclNode) or isinstance(n, IdentNode):
      return n.val
    elif type(n) in [ClassNode, FunctionNode, EnumNode]:
      return n.name
    elif type(n) == AssignNode:
      return n[0].gen_js(0).strip()
      
  if len(p) == 5 and (p[2] == "*" or (type(p[2]) == IdentNode and p[2].val == "*")):
    p[0] = ExportFromNode(p[3])
    p[0].add(ExportIdent("*"))
  elif len(p) == 5:
    p[0] = ExportFromNode(p[3])
    for n in p[2]:
      p[0].add(n)
  elif len(p) == 4 and p[2] == "default":
    n = p[3]
    
    name = get_name(n)

    if type(p[3]) == AssignNode and type(p[3][0]) == IdentNode:
        p[3] = VarDeclNode(p[3][1], local=True, name=p[3][0].val)
        
    p[0] = ExportNode(name, is_default=True)
    p[0].is_default = True
    p[0].add(p[3])

    print(p[0])
  elif len(p) == 4 and type(p[2]) == list:
    p[0] = StatementList()
    for n in p[2]:
      p[0].add(ExportNode(n.val))      
  elif len(p) == 4 and type(p[2]) == VarDeclNode:
    n = p[2]
    p[0] = StatementList()
    
    def visit(n):
      if n.parent != None:
        n.parent.remove(n)
      
      name = get_name(n)
      en = ExportNode(name)
      en.add(n)
      
      p[0].add(en)
      
      if len(n) < 3: return
      for c in n[2:]:
        visit(c)
    
    visit(n)
    
  elif len(p) == 4:
    n = p[2]
    
    name = get_name(n)
    
    p[0] = StatementList()
    
    if type(p[2]) == list:
      for n in p[2]:
        n2 = ExportNode(name)
        p[0].add(n2)
    else:
      name = get_name(p[2])
      p[0] = ExportNode(name)
      p[0].add(p[2])
  elif len(p) == 3:
    n = p[2]
    
    name = get_name(n)
    
    p[0] = ExportNode(name)
    p[0].add(p[2])
  
def p_export_clause(p):
  '''export_clause : LBRACKET RBRACKET
                   | LBRACKET exports_list RBRACKET
                   | LBRACKET exports_list COMMA RBRACKET
  '''
  set_parse_globals(p)
  if len(p) == 3:
    p[0] = []
  elif len(p) in [4, 5]: 
    p[0] = p[2]

def p_exports_list(p):
  ''' exports_list : export_spec
                   | exports_list COMMA export_spec
  '''
  set_parse_globals(p)
  if len(p) == 2:
    p[0] = [p[1]]
  else:
    if type(p[1]) != list:
      p[0] = [p[1]]
    else:
      p[0] = p[1]
      p[0].append(p[3])
  
def p_export_spec(p):
  ''' export_spec : ID
                  | ID ID ID
  '''                  #middle ID is 'as'
  set_parse_globals(p)
  if len(p) == 4 and p[2] != "as":
    raiseSyntaxError(None, "expected 'as'")
  
  if len(p) == 2:
    p[0] = ExportIdent(p[1])
  elif len(p) == 4:
    p[0] = ExportIdent(p[1], p[3])
    
def p_catch_tok(p):
    r'''catch_tok : CATCH'''
    
    set_parse_globals(p)
    if p[1] != "catch":
        raiseSyntaxError(None, "expected 'catch'")
    
    p[0] = p[1]
    
def p_catch(p):
  '''catch : catch_tok paren_expr statement_nonctrl
           | catch_tok paren_expr LBRACKET statementlist RBRACKET
  '''

  set_parse_globals(p)
  if len(p) == 4:
    p[0] = CatchNode(p[2])
    p[0].add(p[3])
  else:
    p[0] = CatchNode(p[2])
    p[0].add(p[4])

def p_else(p):
  '''else : ELSE ctrl_statement
  '''
  set_parse_globals(p)
  
  p[0] = ElseNode()
  p[0].add(p[2])
  
def p_break(p):
  '''break : BREAK 
           | BREAK ID
  '''
            
  set_parse_globals(p)
  
  p[0] = BreakNode()
  if len(p) == 3:
    p[0].label = p[2]

def p_continue(p):
  '''continue : CONTINUE 
              | CONTINUE ID
  '''
            
  set_parse_globals(p)
  p[0] = ContinueNode()
  
  if len(p) == 3:
    p[0].label = p[2]

def p_return(p):
  '''return : RETURN expr
            | RETURN
  '''
  
  set_parse_globals(p)
  if len(p) == 3 and p[2] != ";":
    p[0] = ReturnNode(p[2])
  else:
    p[0] = ReturnNode(ExprNode([]))
    
def p_yield(p):
  '''yield : YIELD expr
            | YIELD'''
  
  set_parse_globals(p)
  if len(p) == 3 and p[2] != ";":
    p[0] = YieldNode(p[2])
  else:
    p[0] = YieldNode(ExprNode([]))

def p_id_no_enum(p):
  ''' id_no_enum : ID
                 | GET
                 | SET
                 | STATIC
                 | CATCH
                 | GLOBAL
                 | AWAIT
                 | FROM
  '''
  set_parse_globals(p)
  p[0] = IdentNode(p[1])
  #p[0] = p[1]

#wrapper rule to include GET and SET,
#which are "soft" keywords.
def p_id(p):
  ''' id : ID
         | GET
         | SET
         | STATIC
         | CATCH
         | GLOBAL
         | CHAR
         | AWAIT
         | FROM
         | ENUM
  '''
  set_parse_globals(p)
  p[0] = IdentNode(p[1])
  #p[0] = p[1]
    
# Error rule for syntax errors
def err_find_line(lexer, lpos):
  if type(lexer) != Lexer: lexer = lexer.lexer
  
  lpos = min(lpos, len(lexer.lexdata)-1)
  try:
    i = lpos
    
    while i >= 0 and lexer.lexdata[i] != "\n":
      i -= 1
    
    """
    i2 = i-1
    while i2 >= 0 and lexer.lexdata[i2] != "\n":
      i2 -= 1
    
    i2 = i2-1
    while i2 >= 0 and lexer.lexdata[i2] != "\n":
      i2 -= 1
    """
    
    j = lpos
    
    while j < len(lexer.lexdata) and lexer.lexdata[j] != "\n":
      j += 1
    
    col = lpos-i-1;
    colstr = ""
    for k in range(col):
      colstr += " "
    colstr += "^"
    
    linestr = lexer.lexdata[i+1:j]
    if len(linestr) > 48:
      linestr = linestr[:48]
    if len(colstr) > 48:
      colstr = colstr[:48]
      
    return linestr, colstr
  except TypeError:
    return "Couldn't find error line", ""

def get_l(l):
  if type(l) != int:
    l = l(0)
  if type(l) != int:
    l = l(0)
  return l
  
def get_cur_pos(p):
  """
  ls = [glob.g_lexpos]
  if p != None:
    if type(p.lexpos) == int:
      ls.append(p.lexpos)
    else:
      for i in range(len(p)):
        ls.append(get_l(p.lexpos(i)))
    ls.append(p.lexer.prev.lexpos)
    ls.append(p.lexpos2)
    tok = p.lexer.token()
    if tok != None:
      ls.append(tok.lexpos+1)
      
  lexpos = None
  for l in ls:
    if lexpos == None:
      lexpos = l
      continue
      
    if l != 0:
      lexpos = min(l, lexpos)

  if lexpos == None: lexpos = 0
  """
  
  lex = glob.g_lexer
  if lex is not None and not isinstance(lex, LexWithPrev):
    lex = lex._lexwithprev
    
  if lex is not None and lex._force_lexpos_line is not None:
    lexpos, line = lex._force_lexpos_line
  elif type(p) == LexToken:
    lexpos, line = p.lexpos, p.lineno
  elif p != None and type(p.lineno) != int:
    lexpos = p.lexpos(0)
    line = p.lineno(0)
  elif p != None and p.lexer.prev != None:
    lexpos = p.lexer.prev.lexpos
    line = p.lexer.lexer.lineno
  else:
    lexpos = glob.g_lexpos
    line = glob.g_line
    
  return lexpos, line
  
  """
  ls = [glob.g_line]
  if p != None:
    if type(p.lineno) == int:
      ls.append(p.lineno)
    else:
      for i in range(len(p)):
        ls.append(get_l(p.lineno(i)))
        
  line = 0
  for l in ls:
    line = max(l, line)
  
  return lexpos, line
  """
  
def print_err(p, do_exit=True, msg=None):
  if glob.g_print_stack and not glob.g_validate_mode:
    traceback.print_stack()
    
  if msg is None:
    msg = glob.g_error_msg
    glob.g_error_msg = None
  if msg is None:
    msg = "syntax error"
    
  if p == None and not glob.g_validate_mode:
    sys.stderr.write(msg +": unexpected EOF in input\n")
    return

  l, line = get_cur_pos(p) 
    
  linestr, colstr = err_find_line(p.lexer, l)
  
  if glob.g_msvc_errors:
    file = os.path.abspath(glob.g_file)
  else:
    #try find a basepath.  this assumes
    #that js_cc is executed from the same working
    #directory, and thus we can calculate the base path
    #by counting ../'s.  it's kindof stupid.
    
    file = glob.g_file
    f2 = ""
    for i in range(file.count("../") + file.count("..\\")):
      f2 += "../"
      
    basepath = os.path.abspath(f2)
    file = os.path.abspath(glob.g_file)[len(basepath):]
    if file.startswith(os.path.sep): file = file[1:]
  
  if glob.g_validate_mode:
    return
  
  if glob.g_print_stack:
    sys.stderr.write("\n");
    
  sys.stderr.write("%s:(%d:%d): error: %s\n"%(file, line+1, l+1, msg))
  
  if not glob.g_msvc_errors:
    sys.stderr.write("%s\n%s\n"%(linestr, colstr))
  
  #sys.stderr.write("P: %s\n" % p)
    
  if do_exit and glob.g_exit_on_err:
    sys.exit(-1)

tried_semi = False
error_rule_stack = 0

def resetErrorRuleStack():
    global error_rule_stack
    error_rule_stack = 0

cii = 0

def p_error(p):
  global parser
  global error_rule_stack
  global cii

  if error_rule_stack > 0:
    return

  lex = get_lexer(p)
  
  if p and lex._force_lexpos_line is not None:
    p.lexpos = lex._force_lexpos_line[0]
    p.lineno = lex._force_lexpos_line[1]
    p.line = lex._force_lexpos_line[1]

  if glob.g_production_debug:
    if p == None:
      sys.stderr.write("in p_error\n")
    else:
      sys.stderr.write("in p_error %s %s\n" % (str(p.type), str(p.value)))
  
  if p == None:
    if not restricted() and glob.g_tried_semi == False:
      if glob.g_production_debug:
        sys.stderr.write("Trying SEMI token. . .\n");

      t = LexToken()
      t.type = "SEMI"
      t.value = ";"
      t.lexpos = -1
      t.lineno = -1
      glob.g_lexer.push_front(t)
      glob.g_tried_semi = True
      
      parser._parser.errok()
    else:
      sys.stderr.write(glob.g_file + ": error: unexpected end of file\n")
    return
  else:
    glob.g_error_pre = p

    if glob.g_production_debug:
      sys.stderr.write("Trying SEMI token. . .\n");

    if handle_semi_error(p):
      parser._parser.errok()

      glob.g_error = False
      if glob.g_production_debug or glob.g_semi_debug:
        linestr, colstr = err_find_line(p.lexer, p.lexpos);
        lineno = p.lineno if type(p.lineno) == int else p.lineno(0)
        
        sys.stderr.write("handled semicolon error : %d\n" % lineno)
        sys.stderr.write(linestr+"\n")
        sys.stderr.write(colstr+"\n")
      return
    else:      
      glob.g_error = True

      print_err(p)
      return
      
  if glob.g_error:
    print_err(glob.g_error_pre)
    
  glob.g_error_pre = p
  glob.g_error = True

  try:
    line = int(p.lineno)
  except:
    line = p.lineno(1)
  
  try:
    lexdata = p.lexer.lexer.lexdata
    sline = p.lexer.lexer.lexpos
  except:
    lexdata = p.lexer.lexdata
    sline = p.lexer.lexpos
  
  sline = lexdata[sline-40:sline+1]

mod = sys.modules[__name__]
for k in list(mod.__dict__.keys()):
  if k.startswith("p_"):
    mod.__dict__[k].name = k.replace("p_", "")
    
# Build the parser
class Parser:
  def __init__(self, yacc):
    self._parser = yacc
    
  def parse(self, data, lexer=None, debug=None):
    global scopestack, parsescope, restrict_stacks
    
    scopestack = []
    parsescope = {}
    for k in restrict_stacks:
      restrict_stacks[k] = []
    
    glob.g_tried_semi = False
    
    import traceback
    ret = None
    #try:
    if lexer != None:
      if debug is not None:
        ret = self._parser.parse(data, lexer=lexer, tracking=True, debug=debug)
      else:
        ret = self._parser.parse(data, lexer=lexer, tracking=True)
    else:
      if debug is not None:
        ret = self._parser.parse(data, tracking=True, debug=debug)
      else:
        ret = self._parser.parse(data, tracking=True)
    #except:
    #  traceback.print_last()
      #print(sys.exc_info(), dir(sys.exc_info()))
      #raise sys.exc_info()[1]
      
    return ret

def p_error_push(p):
    '''error_push :
    '''
    global error_rule_stack
    error_rule_stack += 1

def p_error_pop(p):
    '''error_pop :
    '''

    global error_rule_stack
    error_rule_stack -= 1


_parser = yacc.yacc(tabmodule="perfstatic_parsetab", debug=True)
parser = Parser(_parser);

def gen_grammar():
  def format(s):
    s = s.strip()
    lines = s.split("\n")
    col = lines[0].find(":")
    if col < 0:
      sys.stderr.write("Error! " + s + "\n")
      return s 
    
    indent = ""
    for i in range(col):
      indent += " "
      
    s2 = ""
    for i, l in enumerate(lines):
      l = l.strip()
      if i > 0:
        s2 += indent
      s2 += l + "\n"
    return s2
    
  buf = "===Tokens===\n"
  import js_lex
  for k in list(js_lex.__dict__.keys()):
    if not k.startswith("t_"): continue
    t = js_lex.__dict__[k]
    if type(t) != str:
      t = t.__doc__
      
    rule = k[2:] + " : " + str(t)
      
    buf += format(rule)
  
  buf += "\n\n===Productions==="
  mod = sys.modules[__name__]
  for k in list(mod.__dict__.keys()):
    if not k.startswith("p_"): continue
    
    p = mod.__dict__[k]
    buf += format(p.__doc__) + "\n\n"
  
  return buf

if __name__ == "__main__":
  #spit out grammar
  print(gen_grammar())
  
