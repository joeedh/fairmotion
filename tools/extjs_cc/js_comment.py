from js_ast import *
from js_lex import plexer
from js_global import glob, Glob
  
def process_comments(node, typespace):
  insert_newline_nodes(node, typespace)
  insert_comment_nodes(node, typespace)
  print("Comment processing!")
  
def unnest_comments(node, typespace):
  #move comments that are too deep in the ast tree up
  def recurse(n):
    for c in n:
      recurse(c)
      
    if n.comment == None: return
    
    n2 = n
    #find top-most node with same lineno 
    while type(n2.parent) != StatementList and n2.parent != None and n2.parent.line == n2.line and n2.parent.comment == None:
      n2 = n2.parent
    
    if n2 == n: return
    n2.comment = n.comment
    n2.commentline = n.commentline
    n.comment = None
  
  #move comments that are too high in the ast tree downwards
  def recurse_down(n):
    def visit(n2, state):
      if abs(n2.line-state[0]) < state[1]:
        state[1] = abs(n2.line-state[0])
        state[2] = n2
      for c in n2:
        visit(c, state)
      
    for c in n:
      recurse_down(c)
      
    if n.comment == None: return
    if n.commentline == n.line: return
    
    state = [n.commentline, n.line, n]
    visit(n, state)
    
    n2 = state[2]
    if n2 == n: return
    
    n2.comment = n.comment
    n2.commentline = n.commentline
    n.comment = None
    
  recurse(node)
  recurse_down(node)
