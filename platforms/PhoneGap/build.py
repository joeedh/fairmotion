import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile

basepath = "./platforms/PhoneGap/appfiles/Fairmotion"

def build():
  print("Building phonegap app. . .")
  
  zf = zipfile.ZipFile("phonegap_app.zip", "w")

  if not os.path.exists(basepath + "/www/js"):
    os.makedirs(basepath + "/www/js")
  if not os.path.exists(basepath + "/www/img"):
    os.makedirs(basepath + "/www/img")

  for f in os.listdir(basepath + ""):
    path = basepath + "/" + f
	
    if f == "js": continue
    
    zf.write(path, f);
    
  for f in os.listdir(basepath + "/www/img"):
    path = basepath + "/www/img/" + f
    
    zf.write(path, "www/img/"+f);
    
  
  print("  copying files")
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
