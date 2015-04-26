import os, sys, os.path

path = sys.argv[1];
file = open(path, "r")
buf = file.read()
file.close()

lines = buf.split("\n")
print("BEGIN")

in_sub = "?_IN_?"

files = {}
def do_file(l):
  if l[0] not in files:
    files[l[0]] = []
  files[l[0]].append(int(l[1]))
  
for l in lines:
  if l[1] == ":":
    l = l.split(":")
    l[0] += ":" + l[1]
    l.pop(1)
  else:
    l = l.split(":")
  
  do_file(l)

for path in files:
    #if "spline.js" not in path:
    #  continue
    
    f = open(path, "r")
    lines = f.readlines()
    f.close()
    
    for i in files[path]:
      if i >= len(lines):
        continue
        
      l = lines[i].strip()
      
      #scan one line down and up if necessary
      if not l.startswith("for "):
        i -= 1
        l = lines[i].strip()
      if not l.startswith("for "):
        i += 2
        l = lines[i].strip()
      
      if not l.startswith("for "):
        print("Failed to replace a for loop")
        print("\t", path, "around line", i)
        continue
      
      lines[i] = lines[i].replace(" in ", " of ")
    
    buf = ""
    for l in lines:
      buf += l
      if not l.endswith("\n"):
        buf += "\n"
    
    f = open(path, "w")
    f.write(buf)
    f.close()
    
    
      