import os, os.path, sys, re

import js_sources

pathux = [];

def normpath(path):
  return os.path.normpath(os.path.abspath(path)).replace("\\", "/")

  
def calcRelPath(path, base, p2):
  base = base.strip()
  base2 = os.path.split(p2)[0].replace("\\", "/")
  
  if base.endswith("/") or base.endswith("\\"):
    base = base[:-1]
  
  i = 0
  while len(base2) > 0:
    base2 = os.path.split(base2)[0]
    if len(base2) in [2, 3] and base2[1] == ":":
      break
    elif base2 == "/" or base2 == "\\" or base2 == "\\." or base2 == "./":
      break
    
    #print(i, base2)
    if base.startswith(base2):
      break
    i += 1
  
  
  startbase = base
  base = p2[len(base2):]
  if base.startswith("/"):
    base = base[1:]
  
  count = startbase[len(base2):].count("/")
  for i in range(count):
    base = "../" + base
  
  if count == 0:
    base = "./" + base
  
  #if "parse" in base:
  #  print(base, path[16:])
  return base.replace("\\", "/").strip()
  
def dofile(path):
  if "path.ux" in path:
    return
  if not path.endswith(".js"):
    return
    
  base = os.path.split(path)[0].replace("\\", "/")
  fname = os.path.split(path)[1].replace("\\", "/")
  
  file = open(path, "r")
  buf = file.read()
  file.close()
  
  found = 0
  
  for old, new in pathux:
    p1 = calcRelPath(path, base, old)
    if p1 in buf:
      p2 = calcRelPath(path, base, new)
      buf = buf.replace(p1, p2)
      
      found = 1
      
  if found:
    file = open(path, "w")
    file.write(buf)
    file.close()
    
  
  return found
  
for f in js_sources.sources:
    if "path.ux" in f:
      
      f2 = os.path.split(f)[1]
      f2 = "src/path.ux/scripts/" + f2
      f2 = normpath(f2)
      
      f3 = normpath(f)
      pathux.append([f2, f3])
    
for base, dir, files in os.walk("./src"):
  #print(base)
  for f in files:
    path = base + os.path.sep + f
    path = normpath(path)
    
    if "path.ux" in path or not f.lower().strip().endswith(".js"): continue
    
    ok = dofile(path)
    
    if ok:
      print("patched ", (base + os.path.sep + f).replace("\\", "/"))

  