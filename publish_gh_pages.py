#!/usr/bin/env python

import os, sys, os.path, subprocess

def getRepoURL():
  p = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True)
  repo_url = str(p.stdout, "utf8").strip()
  return repo_url

if not os.path.exists("site"):
    print("checking out gh-pages into ./site")
    url = getRepoURL()
    
    os.system("git clone " + url + " site")
    path = os.getcwd()
    
    os.chdir("./site")
    os.system("git checkout gh-pages")
    os.system("git pull")
    
    os.chdir(path);
  
path = os.getcwd()
os.chdir("./site")
os.system("unzip -o ../dist/html5app.zip")
os.system("git add *")
os.system("git commit -a -m \"update gh-pages\"")
os.system("git push")
os.chdir(path)
