import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile

def build():
  print("Building chrome app. . .")
  
  zf = zipfile.ZipFile("chromeapp.zip", "w")

  if not os.path.exists("./chromeapp/fcontent/"):
    os.makedirs("./chromeapp/fcontent/")
    
  for f in os.listdir("./chromeapp"):
    path = "./chromeapp/" + f
    if f == "fcontent": continue
    
    zf.write(path, f);
    
  for f in os.listdir("./chromeapp/icons"):
    path = "./chromeapp/icons/" + f
    
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
    
    path = "chromeapp/fcontent/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  print("done")
