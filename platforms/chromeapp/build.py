import os, sys, os.path, time, random, math
import shelve, struct, io, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import runpy
from math import floor
import zipfile
from .. import util

basepath = "./dist/chromeapp"
srcpath = "./platforms/chromeapp/app"

def configure():
    util.copy_tinymce(basepath + "/fcontent")

def build():
  util.doprint("Building chrome app. . .")
  
  util.copy_tinymce(basepath + "/fcontent")

  zf = zipfile.ZipFile("dist/chromeapp.zip", "w")

  os.makedirs(basepath+"/fcontent", True)
  os.makedirs(basepath+"/icons", True)

  for f in os.listdir(srcpath):
    if f == "addons": continue

    path = srcpath+"/" + f
    if f in ["fcontent", "icons"]: continue

    file = open(path, "rb")
    buf = file.read()
    file.close()
    file = open(basepath + "/" + f, "wb")
    file.write(buf)
    file.close()

    zf.write(path, f)
    
  for f in os.listdir(srcpath+"/icons"):
    path = srcpath+"/icons/" + f

    file = open(path, "rb")
    buf = file.read()
    file.close()
    file = open(basepath + "/icons/" + f, "wb")
    file.write(buf)
    file.close()

    zf.write(path, f)
    
  
  print("  copying files")
  for f in os.listdir("./build"):
    if not f.startswith("chrome") and f.endswith(".js"):
      continue

    if f.startswith("_"): continue
    if f == "addons": continue

    path = "build/" + f
    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    zf.write(path, "fcontent/" + f);
    
    path = basepath + "/fcontent/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  print("done")
