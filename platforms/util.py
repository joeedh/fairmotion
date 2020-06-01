import sys

#fix stupid console on win32

if "win" in sys.platform:
  import ctypes

  kernel32 = ctypes.windll.kernel32
  #kernel32.AllocConsole()
  handle = kernel32.GetStdHandle(-11)

  error = kernel32.GetLastError()
  kernel32.SetConsoleMode(handle, 1|4)
  #print("error", error, handle);


colormap = {
  "black"   : 30,
  "red"     : 31,
  "green"   : 32,
  "yellow"  : 33,
  "blue"    : 34,
  "magenta" : 35,
  "cyan"    : 36,
  "teal"    : 36,
  "white"   : 37,
  "reset"   : 0,
  "grey"    : 2,
  "gray"    : 2,
  "orange"  : 202,
  "pink"    : 198,
  "brown"   : 314,
  "lightred": 91,
  "peach"   : 210,
  "darkblue" : 273,
  "lightblue" : 268
}

def termColor(s, c):
  if c in colormap:
    c = colormap[c]

  if c > 107:
    s2 = '\u001b[38;5;' + str(c) + "m"
    return s2 + s + '\u001b[0m'

  s = str(s)
  c = str(c)

  return '\u001b[' + c + 'm' + s + '\u001b[0m'

def doprint(p, color="teal"):
    print(termColor(p, color))
    sys.stdout.flush()
