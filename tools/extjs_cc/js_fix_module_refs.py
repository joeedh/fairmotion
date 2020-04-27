import os, sys, os.path
from js_ast import *
from js_lex import plexer
from js_global import glob, Glob
import re, traceback
import argparse, base64, json
from js_cc import js_parse
from js_process_ast import traverse
import runpy


def resolve_path(st, sources, path):
  path = os.path.split(path)
  fname = path[1]
  path = path[0]
  
  name = st[0].strip()
  
  if len(name) == 0:
    return
    
  if not name.lower().endswith(".js"):
    name += ".js"
  
  #print(name)
  path2 = None
  if name[0] == ".":
    name = path + "/" + name
    path2 = os.path.abspath(os.path.normpath(name))
  else:
    for f in sources:
      f1 = os.path.split(f)[1]
      
      if f1 == name:
        path2 = f
        break
  
  if path2 is None:
    sys.stderr.write("Warning:%s:%i: failed to resolve module %s\n" % (fname, st[4], st[0]))
  
  path2 = os.path.relpath(path2, path).replace(os.path.sep, "/").strip()
  
  if not path2.startswith("."):
    path2 = "./" + path2
  
  st[3] = path2
  
def resolve_paths(statements, sources, path):
  for st in statements:
    resolve_path(st, sources, path)
  
  
  
def substitute(buf, statements):
  out = ""
  j = 0
  i2 = 0
  i = 0
  
  while i < len(buf):
    if j >= len(statements):
      while i < len(buf):
        out += buf[i] + ":"
        i += 1
      break
      
    if i == statements[j][1]:
      out += statements[j][3]
      i = statements[j][2]
      i2 = statements[j][2]
      
      j += 1
      continue
      
    out += buf[i]
    i += 1
  
  return out
  
def main(path, sources):
  
  state = [0]
  
  file = open(path, "r")
  buf = file.read()
  file.close()
  
  lines = buf.split("\n")
  
  linemap = {}
  i = 0
  line = 0
  while i < len(buf):
    linemap[i] = line
    if buf[i] == "\n":
      line += 1
    i += 1
  
  statements = []
  
  def next(i, str):
    return buf[i:].startswith(str)
  
  visitset = set()
  
  schar = [""]
  
  def state1(lexpos):
    i = lexpos
    mystate = 0
    
    if next(i, "/*"):
      state[0] = 1
      return i + 2
    elif buf[i] in ["'", '"', "`"]:
      schar[0] = buf[i]
      state[0] = 2
      return i + 1
    elif next(i, "//"):
      state[0] = 3
      return i + 2
      
    if not next(i, "import"):
      return i + 1
    
    while i < len(buf):
      if buf[i] == "{":
        mystate += 1
      elif buf[i] == "}":
        mystate -= 1
        
      if mystate == 0 and next(i, "from"):
        break
        
      i += 1
    
    if i == len(buf):
      sys.stderr.write("error!\n");
      sys.exit(-1)
    
    i += 4
    chars = set(["'", '"', '`'])
    ws = set([" ", "\t", "\n", "\r"])
    
    while buf[i] in ws:
      i += 1
    
    i += 1
    start = i
    
    while buf[i] not in chars:
      i += 1
    
    end = i
    path2 = buf[start:end].strip()
    statements.append([path2, start, end, "bleh", linemap[start]])
    
    return i+1
  
  def string(i):
    if buf[i] == schar[0] and buf[i-1] != "\\":
      state[0] = 0
    return i + 1
    
  def comment(i):
    if next(i, "*/"):
      state[0] = 0
      i += 1
      
    return i + 1
    
  def linecomment(i):
    if buf[i] == "\n":
      state[0] = 0
    return i + 1
    
  states = [state1, comment, string, linecomment]
  
  i = 0
  while i < len(buf):
    start = i
    i = states[state[0]](i)
    if i == start:
      i += 1
  
  node = js_parse(buf)
  
  #traverse(node, ImportNode, visit)
  resolve_paths(statements, sources, path)
  
  buf = substitute(buf, statements)
  print(buf[:600])
  """
  for l in statements:
    print(l)
  #"""
  #print(node.gen_js(0)[:500])
  
def error():
  sys.stderr.write("usage: js_fix_module_refs.py path_to_file --sources js_sources.py \n")
  sys.exit(-1)

cparse = argparse.ArgumentParser(add_help=False)
cparse.add_argument("--help", action="help", help="Print this message")
cparse.add_argument("infile", help="input file")
cparse.add_argument("--sources", help="js_sources.py file")

args = cparse.parse_args()
path = args.infile
 
js_sources = runpy.run_path(args.sources)["sources"]
sources = set();

for f in js_sources:
  f = os.path.abspath(os.path.normpath(f))
  sources.add(f)
  
if not os.path.exists(path) or not args.sources or not os.path.exists(args.sources):
  error()

main(path, sources)
