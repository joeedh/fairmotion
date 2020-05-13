import js_lex
import js_global
from js_global import glob 
from js_ast import *

import argparse, sys
from js_parse import parser

def setcolor(c):
  sys.stdout.write("\u001b[%im" % c);
  sys.stdout.flush()

colors = [37, 31, 32, 33, 34, 35, 36]

def mark(node, depth=0):
  maxd = [0]
  def maxdepth(n, depth=0):
    maxd[0] = max(maxd[0], depth)

    for c in n:
      maxdepth(c, depth+1)

  maxdepth(node, depth)

  node.level = maxd[0] - depth

  for c in node:
    mark(c, depth+1)

def process(buf):
    glob.g_lexer = js_lex.plexer
    glob.g_destructuring = False
    ret = parser.parse(buf, lexer=js_lex.plexer)

    marks = [-1 for x in range(len(buf))]
    level = [0]
    color = [0]

    nodes = []

    def marklexpos(n):
      if len(n) == 0:
        return

      for c in n:
        marklexpos(c)

      n.lexpos = n[0].lexpos
      n.lexpos2 = n[-1].lexpos2

    def recurse(n):
      if 1: #n.level == level[0]:
        nodes.append(n)

      for c in n:
        recurse(c)
    
    #return  
    mark(ret)
    marklexpos(ret)
    recurse(ret)
    
    level = 1

    c1 = 0
    for ni in range(0, 15): 
      for n in nodes:
        if n.level != ni: continue

        if not isinstance(n, FunctionNode):
          continue

        found = 0
        for i in range(n.lexpos, n.lexpos2):
          if marks[i] < 0:
            marks[i] = c1
            found = 1
          pass
        
        if found:
          c1 = (c1 + 1) % (len(colors)-1)

        #print(n.lexpos, n.lexpos2, n.get_line_str(), n.gen_js(0))

    for i in range(len(buf)):
      if marks[i] == -1:
        c = 0
      else:
        c = marks[i] + 1

      setcolor(colors[c])
      sys.stdout.write(buf[i])

def main():
    cparse = argparse.ArgumentParser()
    glob.add_args(cparse);
    args = cparse.parse_args()

    path = args.infile
    glob.g_file = path

    file = open(path, "r")
    buf = file.read()
    file.close()

    process(buf)

if __name__ == "__main__":
    main()
