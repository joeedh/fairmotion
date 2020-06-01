import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
from .. import util

basedir = "./dist/electron"

def copy(a, b):
    file = open(a, "rb")
    buf = file.read()
    file.close()

    file = open(b, "wb")
    file.write(buf)
    file.close()


run_sh = b"""#!/bin/bash
cd electron
./node_modules/.bin/electron .
"""
run_batch = """
cd %~dp0\\electron
.\\node_modules\\.bin\\electron .
"""

def configure():
  util.doprint("Creating electron skeleton")
  sys.stdout.flush()

  if not os.path.exists(basedir):
    os.makedirs(basedir)

  if not os.path.exists(basedir + "/fcontent"):
    os.makedirs(basedir + "/fcontent")

  if not os.path.exists("./dist/run_electron.sh"):
    f = open("./dist/run_electron.sh", "wb")
    f.write(run_sh)
    f.close()

  if not os.path.exists("./dist/run_electron.bat"):
    f = open("./dist/run_electron.bat", "wb")
    f.write(bytes(run_batch.replace("\n", "\r\n"), "latin-1"))
    f.close()

  copy("./platforms/electron/package.json", basedir + "/package.json")
  path = os.getcwd()

  util.doprint("Running npm install for electron skeleton")
  sys.stdout.flush()

  os.chdir(basedir)
  os.system("npm install")
  os.chdir(path)

  print("\n")

def build():
  util.doprint("Building electron app. . .")
  
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

  copy("./src/vectordraw/vectordraw_canvas2d_worker.js", basedir+"/vectordraw_canvas2d_worker.js");
  copy("./src/vectordraw/vectordraw_skia_worker.js", basedir+"/vectordraw_skia_worker.js");
  copy("./src/path.ux/scripts/platforms/electron/icogen.js", basedir+"/icogen.js");

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
