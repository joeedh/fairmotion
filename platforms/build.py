import platforms.chromeapp.build
import platforms.html5.build
import platforms.PhoneGap.build
import platforms.Electron.build

import glob, os, os.path, sys
from . import util

build_platforms = [
  platforms.chromeapp.build,
  platforms.html5.build,
  platforms.PhoneGap.build,
  platforms.Electron.build
]

try:
    import platforms.build_local
    if hasattr(platforms.build_local, "build_platforms"):
        build_platforms = platforms.build_local.build_platforms
except ImportError:
    print(util.termColor("warning: failed to import platforms/build_local.py", "yellow"))

def build():
  util.doprint("building platform packages. . .")

  util.deepcopy("addons", "build/addons")

  for p in build_platforms:
    p.build()
