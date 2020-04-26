import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile

is_win32 = True if "win" in sys.platform.lower() else False

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

def build():
  print("Building html5 app. . .")

  zf = zipfile.ZipFile("html5app.zip", "w")

  if not os.path.exists("./html5app/fcontent/"):
    os.makedirs("./html5app/fcontent/")

  if not os.path.exists("./html5app/icons/"):
    os.makedirs("./html5app/icons/")

  copy("./platforms/html5/main.html", "./html5app/main.html");
  copy("./src/vectordraw/vectordraw_canvas2d_worker.js", "./html5app/vectordraw_canvas2d_worker.js");
  copy("./src/vectordraw/vectordraw_skia_worker.js", "./html5app/vectordraw_skia_worker.js");

  for root, dirs, files in os.walk("./html5app/node_modules"):
    if is_win32:
        root = root.replace("\\", "/")
    if not root.endswith("/"):
        root += "/"

    for f in files:
        path = root + f
        path2 = path.replace("./html5app/", "")
        zf.write(path, path2)

  print("  copying files")
  for f in os.listdir("./build"):
    if not f.startswith("app") and f.endswith(".js"):
      continue;

    path = "build/" + f
    copy(path, "html5app/fcontent/" + f)

    zf.write(path, "fcontent/" + f);

  for f in os.listdir("./html5app"):
    path = "./html5app/" + f
    if f == "fcontent": continue
    
    zf.write(path, f);
    
  for f in os.listdir("./html5app/icons"):
    path = "./html5app/icons/" + f
    
    zf.write(path, "icons/"+f);

  print("done")
