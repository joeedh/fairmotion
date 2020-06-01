import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile
from .. import util

srcpath = "./platforms/PhoneGap/appfiles/Fairmotion"
pgpath =  "./platforms/PhoneGap/appfiles/Fairmotion"
basepath = "./dist/PhoneGap"

def configure():
  util.doprint("Configuring PhoneGap. . .")

  basepath = "./dist/PhoneGap"
  os.makedirs(basepath, True)
  os.makedirs(basepath + "/www/js", True)
  os.makedirs(basepath + "/www/img", True)
  os.makedirs(basepath + "/www/js/tinymce", True)
  util.copy_tinymce(basepath + "/www/js/tinymce")

def build():
  util.doprint("Building phonegap app. . .")

  os.makedirs(basepath, True)
  os.makedirs(basepath + "/www/js", True)
  os.makedirs(basepath + "/www/img", True)

  zf = zipfile.ZipFile("dist/PhoneGapApp.zip", "w")

  for root, dir, files in os.walk(pgpath):
    for f in files:
        p = os.path.normpath(os.path.join(root, f)).replace("\\", "/")
        bp = os.path.normpath(pgpath)
        zpath = p[len(bp):]

        #print(zpath)

        zf.write(p, zpath)

        dpath = basepath + zpath

        dir = os.path.split(dpath)[0]
        os.makedirs(dir, True)

        file = open(p, "rb")
        buf = file.read()
        file.close()

        file = open(dpath, "wb")
        file.write(buf)
        file.close()

  for f in os.listdir("./build"):
    if not f.startswith("app") and f.endswith(".js"):
      continue;
    
    path = "build/" + f
    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    if not f.strip().lower().endswith(".png"):
	    outpath = "/www/js/"
    else:
	    outpath = "/www/img/"
	
    zf.write(path, outpath + f);
    
    path = basepath + outpath + f
	
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  print("done")
