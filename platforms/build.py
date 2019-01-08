import platforms.chromeapp.build
import platforms.html5.build
import platforms.PhoneGap.build
import platforms.Electron.build

platforms = [
  platforms.chromeapp.build,
  platforms.html5.build,
  platforms.PhoneGap.build,
  platforms.Electron.build
]

try:
    import platforms.build_local
    platforms = platforms.build_local.platforms
except ImportError:
    print("error importing platforms/build_local.py")

def build():
  print("building platform packages. . .")
  
  for p in platforms:
    p.build()
  