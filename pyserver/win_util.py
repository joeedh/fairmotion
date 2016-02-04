import os, sys, os.path, codecs
from ctypes import windll
import ctypes
import stat, time
import config

uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

S_ISDIR = 0x4000

def unixnorm(path):
  #strip out '.', so ./path works
  while path[0] == ".":
    path = path[1:]
  return path 

def normlocal(path):
  path = path.strip()
  
  while len(path) > 0 and path[0] in ["\\", "/"]:
    path = path[1:]
    
  path = "/" + path
  return path
  
def get_drives():
    drives = []
    bitmask = windll.kernel32.GetLogicalDrives()
    for letter in uppercase:
        if bitmask & 1:
            drives.append(letter)
        bitmask >>= 1

    return drives

def drive_to_real(path):
  return path + ":"

FolderID_DOCUMENTS_str = "{FDD39AD0-238F-46AF-ADB4-6C85480369C7}"

class GUID (ctypes.Structure):
  _fields_ = [
    ("data1", ctypes.c_uint),
    ("data2", ctypes.c_ushort),
    ("data3", ctypes.c_ushort),
    ("data4", ctypes.c_char*8),
  ]
 
def widearray_to_string(pbuf, maxlen=260):
  path = ""
  for i in range(maxlen):
    if pbuf[i] == 0: break
    path += chr(pbuf[i])
  return path

def get_appdata():
  return os.environ["APPDATA"]
  
def get_documents():
  FolderID_DOCUMENTS = ctypes.create_string_buffer(128)

  inbuf = (ctypes.c_ushort*64)()
  for i, c in enumerate(FolderID_DOCUMENTS_str):
    inbuf[i] = ord(c)
  windll.ole32.CLSIDFromString(inbuf, FolderID_DOCUMENTS)
 
  pbuf = (ctypes.POINTER(ctypes.c_ushort))()

  ret = windll.shell32.SHGetKnownFolderPath(FolderID_DOCUMENTS, 0, ctypes.c_voidp(0), ctypes.byref(pbuf));

  if ret:
    return None
  return widearray_to_string(pbuf)
  
#print(get_documents())
mydoc_path = get_documents()

def mydoc_to_real(path):
  global mydoc_path
  return mydoc_path
  
def root_handlers():
  ret = {}
  for d in get_drives():
    ret[d] = drive_to_real
  
  ret["My Documents"] = mydoc_to_real
  return ret
  
def split(path):
  path = path.strip()
  path = normlocal(path)
  
  if len(path) == 1 and path != "/" and path != "\\":
    return path
  if path.startswith("/"):
    path = path[1:]
  
  path = path.replace("\\", "/")
  
  if "/" not in path:
    drive = path.strip().replace(":", "")
    return [drive, "", ""]
  else:
    drive = path[:path.find("/")]
    path = os.path.split(path[path.find("/"):])
  
  drive = drive.replace(":", "")
  return [drive, path[0], path[1]]

def ltrim(path):
  path = path.strip()
  while len(path) > 0 and path[0] in ["\\", "/"]:
    path = path[1:].strip()
  return path

def getroot(path):
  path = ltrim(path).replace("\\", "/")
  
  if "/" in path:
    return path[:path.find("/")].strip()
  else:
    return path.strip()
    
def listdir(path):
  if path == "" or path == "/": 
    for k in root_handlers():
      yield k
    return
    
  path = os.path.abspath(os.path.normpath(path))
  
  ret = []
  for f in os.listdir(path):
    if f[0] not in ["$"]:
      yield f

def exists(path):
  return os.path.exists(path)
  
class FakeStat:
  st_mode = S_ISDIR
  st_mtime = time.time()
  st_atime = time.time()
  
def dostat(path):
  drive, dir, fname = split(path)
  dir = dir.replace("/", "").strip()
  
  if (path == "" or path == "/") or dir == "":
    return FakeStat()
  
  return os.stat(local_to_real(path))
  
def local_to_real(path):
  if path == "" or path == "/":
    return path
    
  if path == "/.settings.bin":
    print("APPDATA", get_appdata()) #os.environ["APPDATA"])
    
    dir = get_appdata() + os.path.sep + ".fairmotion" #os.path.join(get_appdata(), "/.fairmotion")
    
    if not os.path.exists(dir):
      print("make dirs", dir) 
      os.makedirs(dir)
      
    path = os.path.join(dir, ".settings.bin")
    print("DIRPATH", dir)
    print("PATH", path)
    
    if not os.path.exists(path):
      templ = config.server_root + "/default_settings_bin"
      f = open(templ, "rb")
      buf = f.read()
      f.close()
      
      f = open(path, "wb")
      f.write(buf)
      f.close()
    
    return os.path.abspath(os.path.normpath(path))
    
  drive, dir, fname = split(path)
  dir = dir.strip()
  
  if dir != "" and dir[0] not in ["/", "\\"]:
    dir = "/" + dir
  
  print("DRIVE", "|" + str(drive) + "|", drive);
  
  hl = root_handlers()[drive]
  path = hl(drive) + dir + "/" + fname
  
  path = os.path.normpath(path).replace(os.path.sep, "/")
  
  return path

def real_to_local(path):
  if path == "" or path == "/" or path == "\\":
    return path
    
  if os.path.abspath(os.path.normpath(path)) == unixnorm(local_to_real("/.settings.bin")):
    return "/.settings.bin"
    
  path = os.path.abspath(os.path.normpath(path))
  path = "/" + path.replace(":", "").replace("\\", "/")
  path = normlocal(path)
  
  while path.endswith("/"):
    path = path[:-1]
    
  return path
    
FOLDER_MIME = "application/vnd.google-apps.folder"

if __name__ == '__main__':
  pass
  #print(get_drives())     # On my PC, this prints ['A', 'C', 'D', 'F', 'H']
  #print(local_to_real("/c/"))
  #print(real_to_local(local_to_real("/c/")))

