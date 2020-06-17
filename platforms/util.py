import sys, os, os.path

def copy_tinymce(dest):
    path = os.path.normpath(os.path.abspath(os.path.join(os.getcwd(), "src/path.ux/scripts/lib/tinymce")))

    if not dest.endswith("/"):
        dest += "/"

    for root, dirs, files in os.walk("./src/path.ux/scripts/lib/tinymce"):
        for f in files:
            path2 = os.path.normpath(os.path.abspath(os.path.join(root, f)))
            path3 = path2[len(path):]
            path3 = path3.replace("\\", "/").strip()
            while path3.startswith("/"):
                path3 = path3[1:]

            dest = dest.replace("\\", "/").strip()
            path3 = dest + path3

            dir = os.path.split(path3)[0]
            if not os.path.exists(dir):
                os.makedirs(dir)

            file = open(path2, "rb")
            buf = file.read()
            file.close()
            file = open(path3, "wb")
            file.write(buf)
            file.close();

if __name__ == "__main__":
    copy_tinymce("./dist/electron/fcontent/tinymce")

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