import os, sys
import platforms.util as util

try:
    import ply
except:
    util.doprint("Installing PLY")
    os.system("pip install ply")

if not os.path.exists("platforms/build_local.py"):
    f = open("platforms/build_local.py", "w")
    f.write("""
#example build_local.py
#
#import platforms.chromeapp.build
#import platforms.html5.build
#import platforms.PhoneGap.build
#import platforms.Electron.build

#build_platforms = [
#  platforms.chromeapp.build,
#  platforms.html5.build,
#  platforms.PhoneGap.build,
#  platforms.Electron.build
#]
""")
    f.close()

import platforms.build

util.doprint("Downloading path.ux")

os.system("git submodule init")
os.system("git submodule update")

startpath = os.getcwd()
os.chdir("src/path.ux/simple_docsys")

util.doprint("Setting up path.ux")
os.system("npm install")
os.chdir(startpath)

util.doprint("Configuring platforms")
for p in platforms.build.build_platforms:
    if hasattr(p, "configure"):
        p.configure()


