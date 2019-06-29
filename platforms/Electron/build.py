import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor

def build():
  print("Building electron app. . .")
  
  basedir = "./electron_build"
  
  if not os.path.exists(basedir):
    os.makedirs(basedir)
	
  if not os.path.exists(basedir + "/fcontent"):
    os.makedirs(basedir + "/fcontent")
    
  print("  copying files")
  
  for f in os.listdir("./platforms/Electron"):
    if f == "__pycache__": continue
    if f == "native": continue

    path = "./platforms/Electron/" + f

    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    path = basedir + "/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()

  def copy(a, b):
    file = open(a, "rb")
    buf = file.read()
    file.close()

    file = open(b, "wb")
    file.write(buf)
    file.close()


  copy("./src/vectordraw/vectordraw_canvas2d_worker.js", "./electron_build/vectordraw_canvas2d_worker.js");
  copy("./src/vectordraw/vectordraw_skia_worker.js", "./electron_build/vectordraw_skia_worker.js");
  #copy("./build/iconsheet.png", "./electron_build/fcontent/iconsheet.png");
  #copy("./build/iconsheet16.png", "./electron_build/fcontent/iconsheet16.png");

  for f in os.listdir("./build"):
    ok = (f.startswith("app") and f.endswith(".js"))
    ok = ok or f.startswith("iconsheet")
    ok = ok or f.endswith(".wasm")
    ok = ok or f.endswith("png");
    ok = ok or f.endswith("svg");
    
    if not ok: continue
    
    path = "build/" + f
    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    path = basedir + "/fcontent/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  file = open(basedir + "/fcontent/app.js", "rb")
  buf = file.read()
  buf = buf.replace(b"\"/fcontent/\"", b"\"./fcontent/\"")
  file.close()
  
  file = open(basedir + "/fcontent/app.js", "wb")
  file.write(buf)
  file.close()
  
  print("done")
