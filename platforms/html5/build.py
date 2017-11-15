import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile

def build():
  print("Building html5 app. . .")
  
  zf = zipfile.ZipFile("html5app.zip", "w")

  if not os.path.exists("./html5app/fcontent/"):
    os.makedirs("./html5app/fcontent/")
  if not os.path.exists("./html5app/icons/"):
    os.makedirs("./html5app/icons/")

  for f in os.listdir("./html5app"):
    path = "./html5app/" + f
    if f == "fcontent": continue
    
    zf.write(path, f);
    
  for f in os.listdir("./html5app/icons"):
    path = "./html5app/icons/" + f
    
    zf.write(path, "icons/"+f);
    
  
  print("  copying files")
  for f in os.listdir("./build"):
    if not f.startswith("chrome") and f.endswith(".js"):
      continue;
    
    path = "build/" + f
    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    zf.write(path, "fcontent/" + f);
    
    path = "html5app/fcontent/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  print("done")
