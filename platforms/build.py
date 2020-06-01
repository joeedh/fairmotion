import platforms.chromeapp.build
import platforms.html5.build
import platforms.PhoneGap.build
import platforms.Electron.build

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
    print("error importing platforms/build_local.py")

def build():
  print("building platform packages. . .")
  
  for p in build_platforms:
    p.build()
  