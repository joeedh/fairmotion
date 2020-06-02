import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile
from .. import util

is_win32 = True if "win" in sys.platform.lower() else False

basepath = "./dist/html5app"

def copy(src, dst):
    src = os.path.abspath(os.path.normpath(src))
    dst = os.path.abspath(os.path.normpath(dst))

    cmd = "copy" if is_win32 else "cp"
    cmd += ' "%s" "%s"' % (src, dst)

    f1 = open(src, "rb");
    buf = f1.read()
    f1.close()
    
    f2 = open(dst, "wb")
    f2.write(buf)
    f2.close()
    
    #print(cmd)
    #os.system(cmd)

def configure():
  os.makedirs("./dist/html5app", True);
  
  util.doprint("Setting up dist/html5app")
  util.copy_tinymce(basepath + "/fcontent/tinymce")
  
  copy("./platforms/html5/nodeserver.js", basepath + "/nodeserver.js")
  copy("./platforms/html5/package.json", basepath + "/package.json")
  
  util.doprint("Executing npm install in dist/html5app...")
  path = os.getcwd()
  os.chdir("dist/html5app")
  os.system("npm install")
  os.chdir(path)
  
def build():
  util.doprint("Building html5 app. . .")

  zf = zipfile.ZipFile("dist/html5app.zip", "w")

  if not os.path.exists(basepath + "/fcontent/"):
    os.makedirs(basepath + "/fcontent/")

  if not os.path.exists(basepath + "/icons/"):
    os.makedirs(basepath + "/icons/")

  copy("./platforms/html5/nodeserver.js", basepath + "/nodeserver.js")
  copy("./platforms/html5/config.js", basepath + "/config.js")
  copy("./platforms/html5/package.json", basepath + "/package.json")
  copy("./platforms/html5/main.html", basepath + "/index.html");
  copy("./src/vectordraw/vectordraw_canvas2d_worker.js", basepath + "/vectordraw_canvas2d_worker.js");
  copy("./src/vectordraw/vectordraw_skia_worker.js", basepath + "/vectordraw_skia_worker.js");

  for root, dirs, files in os.walk(basepath + "/node_modules"):
    if is_win32:
        root = root.replace("\\", "/")
    if not root.endswith("/"):
        root += "/"

    for f in files:
        path = root + f
        path2 = path.replace(basepath+"/", "")
        zf.write(path, path2)

  print("  copying files")
  for f in os.listdir("./build"):
    if not f.startswith("app") and f.endswith(".js"):
      continue;

    path = "build/" + f
    copy(path, basepath+"/fcontent/" + f)

    zf.write(path, "fcontent/" + f);

  for f in os.listdir(basepath):
    path = basepath + "/" + f
    if f == "fcontent": continue
    
    zf.write(path, f);
    
  for f in os.listdir(basepath+"/icons"):
    path = basepath+"/icons/" + f
    
    zf.write(path, "icons/"+f);

  print("done")
