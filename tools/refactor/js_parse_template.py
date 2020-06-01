import ply.yacc as yacc
import sys, os, os.path
import traceback

# Get the token map from the lexer.  This is required.
from js_global import glob

from js_lex import tokens, StringLit, HexInt
from ply.lex import LexToken, Lexer

def p_lthan(p):
    '''lthan : LTHAN
             | TLTHAN
    '''
    p[0] = p[1]

def p_gthan(p):
    '''gthan : GTHAN
             | TGTHAN
    '''
    p[0] = p[1]

def p_id(p):
  ''' id : ID
         | GET
         | SET
         | STATIC
         | CATCH
         | GLOBAL
         | AWAIT
  '''
  p[0] = p[1]
    
def p_left_id(p):
  '''left_id : id ''' # %prec ID_TEMPL'''
  p[0] = p[1]

def p_id_opt(p):
  ''' id_opt : id
             |
  '''
  if len(p) == 2:
    p[0] = p[1]

def p_id_var_type(p):
  '''id_var_type : id 
  '''
  p[0] = p[1]

def p_id_var_decl(p):
  '''id_var_decl : id 
  '''
  p[0] = p[1]

def p_var_type(p):
  ''' var_type : var_type id_var_type
               | id_var_type
               | SHORT
               | DOUBLE
               | CHAR
               | BYTE
               | INFERRED
               | var_type template_ref
  '''
  p[0] = p[1]

def p_templatedeflist(p):
  '''
    templatedeflist : var_type
             | var_type ASSIGN var_type
             | templatedeflist COMMA var_type
             | templatedeflist COMMA var_type ASSIGN var_type
  '''
  p[0] = p[1]
    
def p_template(p):
  '''template : lthan templatedeflist gthan
  '''
  p[0] = p[1]

def p_typeof_opt(p):
  '''typeof_opt : TYPEOF
                |
  '''
  
  if len(p) == 2:
    p[0] = p[1]
  else:
    p[0] = 1

def p_simple_templatedeflist(p):
  '''
    simple_templatedeflist : typeof_opt var_type
                           | simple_templatedeflist COMMA typeof_opt var_type
  '''
  p[0] = p[2]

def p_template_ref(p):
  '''template_ref : lthan simple_templatedeflist gthan
  '''
  p[0] = p[1]

def p_template_ref_validate(p):
  '''template_ref_validate : lthan simple_templatedeflist gthan
  '''
  p[0] = p[1]
  
def p_template_validate(p):
  '''template_validate : template
                       | template_ref_validate
  '''
  #                     | lthan_restrict TYPEOF ID gthan_restrict
  #'''
  p[0] = True

def p_error(p):
  print("template error", p)

template_parser = yacc.yacc(debug=False, tabmodule="template_parsetab", start='template_validate')
  
def template_parse(s):
  from js_lex import tmp_lexer
  ret = template_parser.parse(s, lexer=tmp_lexer)
  
  return ret

def template_validate(s):
  from js_lex import tmp_lexer
  
  glob.g_validate_mode = True
  ret = template_parser.parse(s, lexer=tmp_lexer)

  return ret != None
