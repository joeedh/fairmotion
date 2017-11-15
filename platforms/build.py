#platforms = [
#  "html5",
#  "Electron",
#  "chromeapp",
#]

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

def build():
  print("building platform packages. . .")
  
  for p in platforms:
    p.build()
  