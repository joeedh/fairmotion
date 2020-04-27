import os, sys, os.path
import re, traceback
import argparse, base64, json
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
    st[3] = st[0]
    return
    
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
        out += buf[i]
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
  
DEBUG = 0

def outchar(c):
  if DEBUG:
    sys.stdout.write(c)
    
def resetcolor():
  if DEBUG:
    sys.stdout.write("\033[m")
  
def setcolor(n):
  if DEBUG:
    s = '\033[%im' % (n)
    sys.stdout.write(s)
  
def main(path, sources):
  state = [0]
  
  file = open(path, "r")
  buf = file.read()
  file.close()
  
  if len(buf.strip()) == 0:
    #empty file?
    return
    
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
  
  def importstate(i):
    mystate = 0
    
    if next(i, "/*"):
      setcolor(32)
      state[0] = 1
      return i + 1
    elif buf[i] in ["'", '"', "`"]:
      setcolor(31)
      schar[0] = buf[i]
      state[0] = 2
      return i + 1
    elif next(i, "//"):
      setcolor(33)
      state[0] = 3
      return i + 1
      
    ok = next(i, "import") and (i==0 or buf[i-1] in [";", " ", "\t", "\n", "\r", "}", "/"])
    ok = ok and buf[i+6] in [" ", "\t", "\n", "{", "'", '"', "`"]
    
    if not ok:
      resetcolor()
      return i + 1
    
    outchar("mport ")
    setcolor(34)
    i += 6
    
    while buf[i] in [" ", "\t", "\r", "\n"]:
      i += 1

    start = i

    if buf[i] not in ["'", '"', "`"]:
      while i < len(buf):
        if buf[i] == "{":
          mystate += 1
        elif buf[i] == "}":
          mystate -= 1
          
        if mystate == 0 and next(i, "from"):
          break
        outchar(buf[i])
          
        i += 1
      i += 4
      
      resetcolor()
      outchar("from ")
      
    if i >= len(buf):
      sys.stderr.write("error: %s\n" % (buf[start:start+75]));
      raise RuntimeError("error:%i: >>%s<<\n" % (linemap[start], buf[start:start+75]))
    
    chars = set(["'", '"', '`'])
    ws = set([" ", "\t", "\n", "\r"])
    
    while buf[i] in ws:
      i += 1
    
    i += 1
    start = i
    
    setcolor(35)
    while buf[i] not in chars:
      outchar(buf[i])
      i += 1
    resetcolor()
    
    end = i
    path2 = buf[start:end].strip()
    statements.append([path2, start, end, "bleh", linemap[start]])
    
    return i + 1
  
  _str = [0, 0]
  def string(i):
    _str[0] = _str[1]
    _str[1] = buf[i]
      
    if _str[0] == _str[1]:
      _str[1] = 0
        
    if buf[i] == schar[0] and _str[1] != "\\":
      resetcolor()
      state[0] = 0
      _str[0] = _str[1] = 0
      
    return i + 1
    
  def comment(i):
    if next(i, "*/"):
      state[0] = 0
      resetcolor();
      i += 1
      
    return i + 1
    
  def linecomment(i):
    if buf[i] == "\n":
      resetcolor();
      state[0] = 0
    return i + 1
    
  states = [importstate, comment, string, linecomment]
  
  i = 0
  while i < len(buf):
    if DEBUG: 
      outchar(buf[i])
    
    start = i
    i = states[state[0]](i)
    
    if i == start:
      i += 1
  
  #traverse(node, ImportNode, visit)
  resolve_paths(statements, sources, path)
  
  buf = substitute(buf, statements)
  #print(buf[:200])
  
  file = open(path, "w")
  file.write(buf)
  file.close()
  
  """
  for l in statements:
    print(l)
  #"""
  
def error():
  sys.stderr.write("usage: js_fix_module_refs.py path_to_file --sources js_sources.py \n")
  sys.exit(-1)

if __name__ == "__main__":
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
