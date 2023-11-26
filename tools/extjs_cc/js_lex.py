import sys, traceback, re

from js_global import glob
from ply.lex import LexToken

import ply.yacc as yacc
import ply.lex as lex
from ply.lex import TOKEN
# List of token names.   This is always required
from js_parse_arrowfuncs import lex_arrow

from js_regexpr_parse import parser as rparser
from types import BuiltinMethodType as PyMethodType, BuiltinFunctionType as PyFunctionType

class StringLit (str):
  pass

class Comment (object):
  def __init__(self, val="", lexpos=-1):
    self.val = val
    self.lexpos = lexpos
    self.id = -1
  
res = [
'if', 'else', 'while', 'do', 'function', 
'var', 'let', 'in', 'of', 'for', 'new', "return", "continue", "break",
'throw', 'try', 'catch', 'delete', 'typeof', 'instanceof',
'with', 'switch', 'case', 'default', 'yield',
'const', 'short', 'double', 'char',
'signed', 'variable', 'byte',
'global', 'inferred', 'native', 'class', 'extends',
'static', 'typed', 'finally', 'get', 'set', 'import', 'export', 'from',
'await', "enum", 'interface'
]

special_ids = [
    'set', 'get', 'static', 'function', 'for', 'if', 'while', 'do',
    'eval', 'struct', 'enum'
]

"""
reserved tokens following these rules
are turned back into IDs
"""
reserved_collapsed_rules = []

for special in special_ids:
    rule = [special.upper(), "LPAREN"]
    reserved_collapsed_rules.append(rule)

reserved = {}
for k in res:
  reserved[k] = k.upper()

reserved_lst = []
for k in res:
  reserved_lst.append(k.upper())

"""
to use token states:

states = [
  ("main", "inclusive"|"exclusive") 

add state name as prefix to toke, e.g. t_main_token

stack management:

t.lexer.push_state("main")
t.lexer.pop_state()

get lex tokens between two stored positions (exclude comments and like by not returning them):
  t.lexer.lexdata[t.lexer.code_start:t.lexer.lexpos+1]
]
"""

states = [
  ("incomment", "exclusive"),
  ("instr", "exclusive"),
  ("mlstr", "exclusive")
]

tokens = (
   "MLSTRLIT",
   'COMMENT',
   'INC',
   'DEC',
   'GTHAN',
#   'WS',
   "EXPONENT",
   'LTHAN',
   'EQUAL',
   'MOD',
   'GTHANEQ',
   'LTHANEQ',
   'NUMBER',
   'PLUS',
   'MINUS',
   'TIMES',
   'DIVIDE',
   'LPAREN',
   'RPAREN',
   'SEMI',
   'LBRACKET',
   'RBRACKET',
   'BNEGATE',
   'BAND',
   'BOR',
   'BXOR',
   'LAND',
   'COND_DOT',
   'LOR',
   'NOT',
   'ID',
   "NOTEQUAL",
   "STRINGLIT",
   "REGEXPR",
   "ASSIGN",
   "DOT",
   "BACKSLASH",
   "EMPTYLINE",
#   "NL",
   "COMMA",
   "LSBRACKET",
   "RSBRACKET",
   "COLON",
   "QEST",
   "SLASHR",
   "OPENCOM",
   "CLOSECOM",
   "ALL", #only used in states
   "newline",
   "LSHIFT",
   "RSHIFT",
   "LLSHIFT",
   "RRSHIFT",
   "ASSIGNPLUS",
   "ASSIGNMINUS", 
   "ASSIGNDIVIDE", 
   "ASSIGNTIMES",
   "ASSIGNBOR",
   "ASSIGNMOD",
   "ASSIGNBAND",
   "ASSIGNBXOR",
   "ASSIGNLOR",
   "ASSIGNLAND",
   "VAR_TYPE_PREC",
   
   "ASSIGNLSHIFT",
   "ASSIGNRSHIFT",
   "ASSIGNRRSHIFT",
   "ASSIGNLLSHIFT",
   "BITINV",   
   "NOTEQUAL_STRICT",
   "EQUAL_STRICT",
   "TLTHAN",
   "TGTHAN",
   "ARROW",
#   "ARROW_LB",
#   "RP_ARROW",
#   "RP_ARROW_LB",
   "ARROW_PRE",
   
   "TRIPLEDOT",
   "TEMPLATE_STR",
   "ARROWPARENS",
   "ID_COLON",
   "CLASS_PROP_PRE",
   "CLASS_PROP_PRIVATE",
   "CLASS_PROP_PUBLIC",
   "DOUBLEQ", #coalesing operator
) + tuple(reserved_lst)

# Regular expression rules for simple tokens
t_TRIPLEDOT = r'\.\.\.'
t_ARROW = r'\=\>'
#t_ARROW_LB = r'\=\>[ \r\n\t]*\{'
#t_RP_ARROW = r'\)[ \r\n\t]*\=\>'
#t_RP_ARROW_LB = r'\)[ \r\n\t]*\=\>[ \r\n\t]*\{'

t_ASSIGNPLUS = r'\+='
t_ASSIGNMINUS = r'-='
t_ASSIGNDIVIDE = r'/='
t_ASSIGNTIMES = r'\*='
t_ASSIGNMOD = r'\%\='
t_ASSIGNBOR = r'\|='
t_ASSIGNBAND = r'\&='
t_ASSIGNBXOR = r'\^='
t_ASSIGNLSHIFT = r'ENOTHINGNODTHINGNOGTHINGNOHTHING'
t_ASSIGNRSHIFT = r'ENOTHINGNODTHINGNOGTHINGNOHTHINGs'
t_ASSIGNLLSHIFT = r'ENOTHINGNODTHINGNOGTHINGNOHTHING'
t_ASSIGNRRSHIFT = r'ENOTHINGNODTHINGNOGTHINGNOHTHING'
t_ASSIGNLOR = r'\|\|='
t_ASSIGNLAND = r'\&\&='

#def t_WS(t):
#    r'[ \r\t]'
#    #drop token by not returning it

t_COND_DOT = r'\?\.'
t_DOUBLEQ = r'\?\?'
t_BITINV = r'\~'
t_LSHIFT = r'\^\^' #lshift/rshift is actually generated by the </> template distinguishing code
t_RSHIFT = r'\^\^'
t_LLSHIFT = r'\^\^\^'
t_RRSHIFT = r'\>\>\>'

t_BAND = r'&'
t_BOR = r'\|'
t_BXOR = r'\^'
t_LAND = r'&&'
t_LOR = r'\|\|'
t_NOT = r'\!'
t_NOTEQUAL_STRICT = r'\!=='
t_EQUAL_STRICT = r'==='
t_EQUAL = r'=='
t_NOTEQUAL = r'\!='
t_INC = r'\+\+'
t_DEC = r'--'
t_PLUS    = r'\+'
t_MINUS   = r'-'
t_TIMES   = r'\*'
t_EXPONENT = r'\*\*'
t_DIVIDE  = r'/'
t_MOD     = r'%'

#lex_arrow(lexdata, lexpos, lookahead_limit=256):
def t_LPAREN(t):
  r'\('
  
  #detect presence of LexWithPrev
  if hasattr(t.lexer, "lexer"):
    lex = t.lexer
    lexdata = t.lexer.lexer.lexdata
  else:
    lex = t.lexer._lexwithprev
    lexdata = t.lexer.lexdata

  lex.paren_lvl += 1
  
  lexpos = t.lexpos
  arrowi = lex_arrow(lexdata, lexpos)
  if arrowi >= 0:
    #print("found an arrow func!")
    t.type = "ARROW_PRE"

  #print(t.type)

  return t
  
def t_RPAREN(t):
  r'\)'
  
  #Detect presence of LexWithPrev
  if hasattr(t.lexer, "lexer"):
    lex = t.lexer
  else:
    lex = t.lexer._lexwithprev
    
  lex.paren_lvl -= 1
  
  return t 
  
def t_LBRACKET(t):
  r'\{'
  l = t.lexer._lexwithprev
  l.brace_lvl += 1
  return t
  
def t_RBRACKET(t):
  r'\}'
  l = t.lexer._lexwithprev
  l.brace_lvl -= 1
  
  if len(l.class_stack) > 0:
    lvl = l.class_stack[-1][0]
    if l.brace_lvl < lvl:
      l.class_stack.pop()
      
  return t

t_ASSIGN = r'='
t_DOT = r'\.'
t_BACKSLASH = r'\\'
t_COMMA = r','
t_LSBRACKET = r'\['
t_RSBRACKET = r'\]'
t_COLON = r'\:'
t_SEMI = r';'
t_QEST = r'\?'
t_ALL = r'ENOTHINGNODTHINGNOGTHINGNOHTHING'
t_TGTHAN = r'sdfwetreENOTHINGNODTHINGNOGTHINGNOHTHINGytery' #ensure we never match anything

def t_GTHANEQ(t):
  r'\>='
  return t
  
def t_LTHANEQ(t):
  r'\<='
  return t
  
def t_GTHAN(t):
  r'\>'
  global in_lthan_test, gthan_ignores
  
  if in_lthan_test: 
    t.type = "TGTHAN"
    return t
  
  if t.lexpos in gthan_ignores:
    return
    
  if t.lexpos in tgthan_lexposes:
    t.type = "TGTHAN"
    return t
  
  if t.lexpos < len(t.lexer.lexdata)-2 and \
     t.lexer.lexdata[t.lexpos+1] == ">" and \
     t.lexer.lexdata[t.lexpos+2] == "=":
    t.type = "ASSIGNRSHIFT"
    t.value = ">>="
    gthan_ignores.add(t.lexpos+1)
    gthan_ignores.add(t.lexpos+2)
    t.lexer.lexpos += 2
  elif t.lexpos < len(t.lexer.lexdata)-3 and \
     t.lexer.lexdata[t.lexpos+1] == ">" and \
     t.lexer.lexdata[t.lexpos+2] == ">" and \
     t.lexer.lexdata[t.lexpos+3] == "=":
    t.type = "ASSIGNRRSHIFT"
    t.value = ">>>="
    gthan_ignores.add(t.lexpos+1)
    gthan_ignores.add(t.lexpos+2)
    t.lexer.lexpos += 3
  elif t.lexpos < len(t.lexer.lexdata)-2 and \
     t.lexer.lexdata[t.lexpos+1] == ">" and \
     t.lexer.lexdata[t.lexpos+2] == ">":
    t.type = "RRSHIFT"
    t.value = ">>>"
    gthan_ignores.add(t.lexpos+1)
    gthan_ignores.add(t.lexpos+2)
  elif t.lexpos < len(t.lexer.lexdata)-1 and t.lexer.lexdata[t.lexpos+1] == ">":
    t.type = "RSHIFT"
    t.value = ">>"
    gthan_ignores.add(t.lexpos+1)
    
  return t

in_lthan_test = False
tgthan_lexposes = set()
gthan_ignores = set()
lthan_ignores = set()

def t_LTHAN(t):
  r'\<'
  global in_lthan_test, lthan_ignores
  
  if not glob.g_lex_templates:
    return t
  
  if in_lthan_test:
    t.type = "TLTHAN"
    return t
  
  if t.lexpos in lthan_ignores:
    return
    
  in_lthan_test = True
  
  import js_parse as jsp
  from js_parse_template import template_validate
  
  s = ""
  lvl = 0
  i = t.lexpos
  lexdata = t.lexer.lexdata
  ret = None
  while i < len(lexdata):
    if lexdata[i] == ">":
      lvl += 1
    elif lexdata[i] == "<":
      lvl -= 1
    if lexdata[i] in ["\n", "\r", ";"]:
      ret = False
      break
      
    s += lexdata[i]
    if lvl == 0: break
    i += 1
 
  if ret != False:
    ret = template_validate(s) 
    if ret:
      t.type = "TLTHAN"
      tgthan_lexposes.add(i) 

  if ret != True:
    if t.lexpos < len(t.lexer.lexdata)-2 and \
     t.lexer.lexdata[t.lexpos+1] == "<" and \
     t.lexer.lexdata[t.lexpos+2] == "=":
      t.type = "ASSIGNLSHIFT"
      t.value = "<<="
      lthan_ignores.add(t.lexpos+1)
      lthan_ignores.add(t.lexpos+2)
      t.lexer.lexpos += 2
    elif t.lexpos < len(t.lexer.lexdata)-3 and \
       t.lexer.lexdata[t.lexpos+1] == "<" and \
       t.lexer.lexdata[t.lexpos+2] == "<" and \
       t.lexer.lexdata[t.lexpos+3] == "=":
      t.type = "ASSIGNLSHIFT"
      t.value = "<<<="
      lthan_ignores.add(t.lexpos+1)
      lthan_ignores.add(t.lexpos+2)
      lthan_ignores.add(t.lexpos+3)
      t.lexer.lexpos += 3
    elif t.lexpos < len(t.lexer.lexdata)-2 and t.lexer.lexdata[t.lexpos+1] == "<" and t.lexer.lexdata[t.lexpos+2] == "<":
      t.type = "LLSHIFT"
      t.value = "<<<"
      lthan_ignores.add(t.lexpos+1)
      lthan_ignores.add(t.lexpos+2)
    elif t.lexpos < len(t.lexer.lexdata)-1 and t.lexer.lexdata[t.lexpos+1] == "<":
      t.type = "LSHIFT"
      t.value = "<<"
      lthan_ignores.add(t.lexpos+1)

  if glob.g_production_debug:
    print(ret, "|", s)  
    print("\n")
  in_lthan_test = False

  return t

class _Rd:
  i = 0
  st = 0

_rd = _Rd()
_rd.i = 0
_rd.st = ""

#this function generates the regular expression used to parse
#JavaScript regular expression literals.
#
#it works by converting stupid ECMAScript's 
#"production grammar" for lexical scanners to regexpr.  
#the standard implies that its grammar is DFA-compatible, 
#and it seems to work.
#
#how I hate self-righteous engineer innuendo such as this. . .

#"""
def gen_re():
  def expect(s):
    if s in [".", "+", "(", "[", "]", ")", "*", "^", "\\"]:
        s = "\\" + s
    
    s = r'(((?<!\\)|(?<=\\\\))' + s + ")"
    return s
      
  def consume_ifnot(s):
    s2 = "[^"
    if type(s) == list:
      for s3 in s:
        if s3 in ["+", "\\", "(", "[", "]", ")", "*", "^"]:
          s3 = '\\' + s3
        
        s2 += s3
    else:
      if s in ["+", "\\", "(", "[", "]", ")", "*", "^"]:
        s = '\\' + s
      s2 += s
      
    s2 += "]"
    return "%s" % s2
    
  def NonTerm(extra=[]):
    return consume_ifnot(["\\n", "\\r"] + extra)
  
  def Char():
    return "(%s|%s|%s)" % (NonTerm(["\\", "/", "["]), BackSeq(), Class())
    
  def FirstChar():
    return "(%s|%s|%s)" % (NonTerm(["*", "\\", "/", "["]), BackSeq(), Class())
  
  def empty():
    return "(\b|\B)"
    
  def Chars():
    return "(%s)*" % Char()
  
  def BackSeq():
    return expect('\\') + NonTerm()
  
  def ClassChar():
    return "(%s|%s)" % (NonTerm(["]", "\\"]), BackSeq())
  
  def ClassChars():
    return ClassChar() + "+"
    
  def Class():
    return "(" + expect("[") + ClassChars() + expect("]") + ")"
  
  def Flags():
    return "[a-zA-Z]*"
    
  def Body():
    return "(" + FirstChar() + Chars() + ")"
    
  def Lit():
    #what is with this stupid grammar?
    #it's supposed to hook into the lexical
    #scanner, but it isn't working without
    #these idiot hacks, like the unrolling of
    #this variable-width lookbehind I'm doing here.
    
    def g(c, n):
      s = "(?<=[([\=,:]"
      
      if n != 0:
        s += "[%s]{%d}" % (c, n)
      
      s += ")"
      return s
    
    """
      g("   ", 3),
      g(" ", 7),
      g("    ", 2),
      g("   ", 3),
      g("     ", 2),
      g(" ", 11),
      g("    ", 3),
      g(" ", 13),
      g("       ", 2),
      g("     ", 3),
      g("    ", 4),
      g(" ", 17),
      g("   ", 6),
      g(" ", 19),
      g("     ", 4),    #20
      g("       ", 3),  #21
      g("           ", 2), #22
      g(" ", 23),
      g("    ", 6),
      g("     ", 5),
      g("             ", 2), #26

    #"""
    
    pats = [];
    for i in range(31):
      pats.append(g(" \t\n\r", i))
      
    pats = tuple(pats)
    
    pat = ""
    for i, p in enumerate(pats):
      if (i != 0):
        pat += "|"
      pat += p
      
    pat = "((" + pat + ")" + expect("/") + ")"
    pat += Body() + expect("/") 
    pat = pat + "(?!/)" + Flags()
    return pat
    
  return Lit()

#print(gen_re())
re1 = gen_re()
 
str1 = r"/ 3) * 3;              //"
#print("\n" + str(str1))

m = re.match(re1, str1)
if m != None:
  s = m.span()
#  print(str1[s[0]: s[1]])
else:
  pass

#sys.exit()
#"""

def t_REGEXPR(t):
    t.lexer.lineno += t.value.count("\n")
    return t

t_REGEXPR.__doc__ = gen_re()

#t_STRINGLIT = r'".*"'
strlit_val = StringLit("")
start_q = 0
mlchar = '`'

def t_TEMPLATE_STR(t):
    r'`([^`]|(\\`))*[^\\]`'
    
    t.type = "STRINGLIT"
    t.value = StringLit(t.value)
    t.lexer.lineno += t.value.count("\n")

    return t
   
t_mlstr_ignore = ''

def t_MLSTRLIT(t):
  r'"""';
  
  global strlit_val, mlchar;
  t.lexer.push_state("mlstr");
  strlit_val = StringLit("")
  mlchar = '"""'

def ml_escape(s):
  i = 0
  lastc = 0
  
  nexts = False
  excl = ['"', "'"]
  
  s2 = ""
  while i < len(s):
    c = s[i]
    
    if nexts:
      nexts = False
      s2 += c
      i += 1
      continue
    
    if c == "\\":
      nexts = True
      s2 += c
      i += 1
      continue
    
    if c in ["'", '"']:
      s2 += "\\"
    
    if c == "\n": c = "\\n"
    if c == "\r": c = "\\r"
    
    s2 += c
    i += 1
  return s2
      
def t_mlstr_MLSTRLIT(t):
    r'"""|\`' #(""")|(\\""")';

    global strlit_val;

    if ("\\" in t.value):
        strlit_val = StringLit(strlit_val + t.value);
        return

    if glob.g_destroy_templates:
        strlit_val = ml_escape(strlit_val)
        
    str = StringLit(strlit_val)
    #str = StringLit(str)

    t.strval = t.value;
    if glob.g_destroy_templates:
        t.value = StringLit('"' + str + '"');
    else:
        t.value = StringLit('`' + str + '`');
    
    t.type = "STRINGLIT"

    t.lexer.pop_state();
    return t;

def t_mlstr_ALL(t):
  r'(.|[\n\r\v])'
  
  global strlit_val
  if 1: #t.lexer.lexdata[t.lexpos:t.lexpos+3] != '"""':
    strlit_val = StringLit(strlit_val + t.value)
  
  t.lexer.lineno += t.value.count('\n')

  
def t_STRINGLIT(t):
  r'\"|\''
  global strlit_val, start_q
  
  start_q = t.value
  strlit_val = StringLit("")
  t.lexer.push_state("instr")
  
def t_instr_STRINGLIT(t):
  r'\"|\''
  
  global strlit_val, start_q
  
  i = t.lexpos-1
  totslash = 0
  while i >= 0 and t.lexer.lexdata[i] == "\\":
    totslash += 1
    i -= 1
    
  if (totslash%2) == 1 or start_q not in t.value:
    strlit_val = StringLit(strlit_val + t.value)
    return
  
  t.lexer.pop_state()
  t.strval = t.value
  t.value = StringLit(start_q + strlit_val + start_q)
  return t

def t_instr_ALL(t):
  r'([^"\']|(\\\'\\"))+';

  global strlit_val
  strlit_val = StringLit(strlit_val + t.value)
  
  t.lexer.lineno += t.value.count('\n')
  
def t_SLASHR(t):
  r'\r+'

comment_str = Comment()
comment_startline = -1
def t_OPENCOM(t):
  r'/\*'
  
  global comment_str, comment_startline
  t.lexer.push_state("incomment")
  
  comment_str = Comment(t.value, t.lexpos)
  comment_startline = t.lexer.lineno if t.lexer.lineno != -1 else 0
  
def t_incomment_CLOSECOM(t):
  r'\*/'
  
  global comment_str
  comment_str.val += t.value
  t.lexer.pop_state()

  t.lexer.lineno += t.value.count("\n")

  i = t.lexer.lexpos
  ld = t.lexer.lexdata

  while i < len(ld):
    if ld[i] not in [" ", "\t", "\n", "\r"]: break
    if ld[i] == "\n":
      comment_str.val += "\n"
      break
    i += 1
    
  t.lexer.comment = comment_str
  
  comment_str.id = t.lexer.comment_id
  t.lexer.comments[t.lexer.comment_id] = [comment_str, comment_startline]
  t.lexer.comment_id += 1

def t_incomment_ALL(t):
  r'(.|[ \n\r\t])' #(?!\*\/)'

  t.lexer.lineno += t.value.count("\n")
  comment_str.val += t.value

# Error handling rule
def t_incomment_error(t):
    print("Illegal character '%s'" % t.value[0])
    #t.lexer.lineno += t.value.count("\n")
    t.lexer.skip(1)

#def t_incomment_newline(t):
#    r'\n+'
#    t.lexer.lineno += len(t.value)
    
# Error handling rule
def t_instr_error(t):
    print("Illegal character in string '%s'" % t.value[0])
    t.lexer.skip(1)

def t_mlstr_error(t):
    print("Illegal character in multiline string '%s'" % t.value[0])
    t.lexer.skip(1)
  
def t_COMMENT(t):
  r'//.*\n'
  global comment_startline, comment_str
  #r'(/\*(.|\n|\r)*\*/)|'

  t.lexer.comment = Comment(t.value, t.lexpos)
  t.lexer.comment.id = t.lexer.comment_id
  t.lexer.comments[t.lexer.comment_id] = [t.lexer.comment, t.lexer.lineno]
  t.lexer.comment_id += 1

  t.lexer.lineno += t.value.count("\n")

cls_prop_id = r'([#a-zA-Z_$]+[a-zA-Z0-9_$0-9]*)'
cls_prop_type = r'(:[ \t]*([a-zA-Z_$]+[a-zA-Z0-9_$0-9<>,= \t]*))?'
cls_prop_re = r'((private[ \t]*)|(public[ \t]*)|(static[ \t]*))?' + cls_prop_id + r'[ \t]*' + cls_prop_type + r'[ \t]*[\n\r;\=]'
cls_prop_re = re.compile(cls_prop_re)

"""
tst = "private static bleh : number<array<f>, g> = 1;"
print(cls_prop_re.match(tst), len(tst))
sys.exit()
#"""

def class_property_validate(line, lexpos):
    i = lexpos-1
    while i >= 0 and line[i] not in ["\n", "\r"]:
        if line[i] not in [" ", "\t", "\n", "\r"]:
            return False
        i -= 1

    i = lexpos
    while i < len(line) and line[i] not in ["\n", "\r"]:
        i += 1

    line = line[lexpos:max(i+1, len(line)-1)]

    m = cls_prop_re.match(line)
    if m is None:
        return False

    #print(m)
    return m.span()[0] == 0


last_id = None

@TOKEN(r'[\$#a-zA-Z_][\$a-zA-Z_0-9]*')
def t_ID(t):
    global last_id

    #p = t.lexer._lexwithprev.peek_i(0)

    #if p is not None and p.type == "COLON":
    #    t.type = "ID_COLON"
    #    t.lexer._lexwithprev.next()
    #else:
    #    t.type = reserved.get(t.value,'ID')    # Check for reserved words

    ld = t.lexer.lexdata
    li = t.lexpos + len(t.value)

    while li < len(ld) and ld[li] in [" ", "\n", "\r", "\t"]:
        li += 1

    if li < len(ld) and ld[li] == ":" and t.value not in reserved:
        t.type = "ID_COLON"
    else:
        t.type = reserved.get(t.value,'ID')    # Check for reserved words

    lex = t.lexer
    if not isinstance(lex, LexWithPrev):
      lex = lex._lexwithprev
      
    if t.type == "CLASS":
      lex.class_stack.append([lex.brace_lvl + 1, lex.paren_lvl])
    
    inside_class_decl = False
    if len(lex.class_stack) > 0:
      brace_lvl = lex.class_stack[-1][0]
      paren_lvl = lex.class_stack[-1][1]
      
      inside_class_decl = lex.brace_lvl == brace_lvl
      inside_class_decl = inside_class_decl and lex.paren_lvl == paren_lvl
    
    if class_property_validate(ld, t.lexpos) and inside_class_decl:
        t2 = LexToken()
        t2.type = t.type
        t2.value = t.value
        t2.lineno = t.lineno
        t2.lexer = t.lexer
        t2.lexpos = t.lexpos

        if t2.value == "private":
          t2.type = "CLASS_PROP_PRIVATE"
        elif t2.value == "public":
          t2.type = "CLASS_PROP_PUBLIC"
        elif t2.value == "static":
          t2.type = "STATIC"
          
        t.lexer._lexwithprev.push_front(t2)

        t.type = "CLASS_PROP_PRE"
        t.value = ""
        last_id = t.type
        #sys.exit()
        return t

    last_id = t.type
    return t

class HexInt(int):
  pass
        
# A regular expression rule with some action code
def t_NUMBER(t):
    r'(0x[0-9a-fA-F]+)|((\d|(\d\.\d+))+(e|e\-|e\+)\d+)|(\d*\.\d+)|(\d+)'
    
    t.strval = t.value
    
    if "." not in t.value and "e" not in t.value and "x" not in t.value:
      t.value = int(t.value)
    elif "x" in t.value:
      t.value = HexInt(t.value, 16)
    else:
      t.value = float(t.value)
    
    return t

def t_EMPTYLINE(t):
  r'\n[ \t]\n'
  t.lexer.lineno += t.value.count("\n")
  
# this rule finds newlines not preceded by backslashes, to handle
#multi-line statements
"""
def t_NL(t):
  r'(?<!\\)\n'
  
  #t.lexer.lineno += 1
  
  #if "\\" not in t.value:
  #  return t
"""

# Define a rule so we can track line numbers
def t_newline(t):
    r'\n+'
    t.lexer.lineno += t.value.count("\n")
      
# A string containing ignored characters (spaces and tabs)
t_ignore  = ' \t'
t_instr_ignore  = ''
t_incomment_ignore = ''

# Error handling rule
def t_error(t):
    print("Illegal character '%s'" % t.value[0])
    t.lexer.skip(1)

class Flags:
  CLASS_DECL = 1
Flags = Flags()

# Build the lexer
class LexWithPrev():
  def __init__(self, lexer):
    self.lexer = lexer
    self.prev = None
    self.cur = None
    self.lineno = 0
    self.lexpos = 0
    self.peeks = []
    self.rawlines = []
    self.prev_lexpos = 0
    
    self.statestack = [];
    self.brace_lvl = 0
    self.paren_lvl = 0
    self.class_stack = []
    
    self._laststack = 0
    self._no_semi_handling = False;
    self._force_lexpos_line = None
    
    self._prev = -1
    self._cur = None

    self.comment = None
    self.comment_id = 0
    self.comments = {}

    lexer._lexwithprev = self
    lexer.comment = None
    lexer.comment_id = 0
    lexer.comments = {}
    
    #Per-character bitflags, see Flags class above
    self.flags = []
    
  def next(self):
    t = self.token()
    if t == None: raise StopIteration

    return t
  
  def peek_i(self, i=0):
    while len(self.peeks) < i+1:
        if self.peek() is None:
            break
    return self.peeks[i][0] if i < len(self.peeks) else None
    
  def peek(self):
    p = self.lexer.token()

    if p is not None:
        p.lineno = self.lineno = self.linemap[p.lexpos]

    if p is None:
        return None
        
    t = LexToken()
    t.type = p.type
    t.value = p.value
    t.lexpos = p.lexpos
    t.lineno = p.lineno #self.lexer.lineno
    
    t._comments = self.lexer.comments
    t._comment = self.lexer.comment
    t._comment_id = self.lexer.comment_id
    
    #p.lineno = self.lexer.lineno
    #p.lexer = self
    
    self.peeks.append([t, self.lexer.lexpos, self.lineno])
    return p
  
  def token_len(self, t):
    if t.type in ["NUMBER", "STRINGLIT"]:
      return len(t.strval)
    else:
      return len(t.value)
    
  def token(self):
    t = self._token()

    if t is not None and t.lexpos >= 0 and t.lexpos < len(self.linemap):
        t.lineno = self.lineno = self.linemap[t.lexpos]

    #print(t)
    return t

  def _token(self):
    self.prev = self.cur;

    if len(self.peeks) > 0:
      self.prev_lexpos = self.lexpos

      self.cur, self.lexpos, self.lexer.lineno = self.peeks.pop(0)
      self.cur.prev_lexpos = self.prev_lexpos
      self.cur.lexpos = self.lexpos

      self.lineno = self.lexer.lineno

      self.comments = self.cur._comments
      self.comment = self.cur._comment
      self.comment_id = self.cur._comment_id
      
      return self.cur

    self.cur = self.lexer.token()

    self.lineno = self.lexer.lineno
    self.prev_lexpos = self.lexpos
    self.lexpos = self.lexer.lexpos

    if self.cur != None:
      self.cur.lexer = self
      self.cur.lineno = self.lexer.lineno
      self.cur.prev_lexpos = self.prev_lexpos
      self.comments = self.lexer.comments
      self.comment = self.lexer.comment
      self.comment_id = self.lexer.comment_id
    else:
      #reset state
      """
      global in_lthan_test, tgthan_lexposes, gthan_ignores, lthan_ignores
      tgthan_lexposes = set()
      gthan_ignores = set()
      lthan_ignores = set()
      in_lthan_test = False;
      """
      pass
      
    #self.lineno = self.lexer.lineno
    #self.prev_lexpos = self.lexpos;
    #self.lexpos = self.lexer.lexpos
    
    return self.cur
    
  def flag_data(self, data):
    fs = self.flags = [0 for x in range(len(data))]
          
  def input(self, data):
    self.flag_data(data)
    
    self.linemap = [0 for i in range(len(data))]
    linemap = self.linemap
    line = 0

    for i in range(len(data)):
        linemap[i] = line
        if data[i] == "\n":
            line += 1

    self._no_semi_handling = False;
    self._force_lexpos_line = None
    self._laststack = 0

    self._prev = -1
    self._cur = None

    self.lexer.lineno = 0
    self.comment_id = 0
    if not in_lthan_test:
      global tgthan_lexposes, gthan_ignores, lthan_ignores
      tgthan_lexposes = set()
      gthan_ignores = set()
      lthan_ignores = set()

    self.lineno = self.lexer.lineno = 0
    
    """
    #ensure all return statements end with ";"
    d2 = ""
    rlen = len("return")
    
    def has_word(data, word):
      return i >= len(word) and data[i-len(word):i] == word
      
    i = 0
    while i < len(data):
      if has_word(data, "return") or has_word(data, "continue"):
        #find newline
        adds = True
        
        b1 = 0
        b2 = 0
        i2 = i
        while i < len(data):
          if data[i] == "\n": break
          if data[i] == "[": b1 += 1
          elif data[i] == "]": b1 -= 1
          if data[i] == "{": b2 += 1
          elif data[i] == "}": b2 -= 1
          d2 += data[i]
          i += 1
        
        adds = d2.strip().endswith("return") or d2.strip().endswith("continue"); #b1 == 0 and b2 == 0
        
        if adds and not d2.strip().endswith(";"):
          d2 += ";"
        d2 += "\n"
      else:
        d2 += data[i]
      
      i += 1
      
    data = d2
    #"""
    
    self.lexer.lineno = self.lineno
    self.lexer.input(data)
    self.rawlines = data.replace("\r\n", "\n").split("\n")
  
  def set_lexpos(self, lexpos):
    self.lexpos = lexpos
    self.lexer.lexpos = lexpos

  def push_front(self, tok):
    if not hasattr(tok, "_comments"):
        tok._comments = ""
    if not hasattr(tok, "_comment"):
        tok._comment = ""
    if not hasattr(tok, "_comment_id"):
        tok._comment_id = -1
        
    self.peeks.insert(0, [tok, tok.lexpos, tok.lineno])
  
  def push_state(self, state):
    self.statestack.push(state)
    self.lexer.push_state(state)
  
  def pop_state(self):
    self.statestack.pop()
    self.lexer.pop_state()
    
plexer = LexWithPrev(lex.lex())
tmp_lexer = LexWithPrev(lex.lex())
plexer.lexer.comments = {}
plexer.lexer.comment = None
plexer.lexer.comment_id = 0
