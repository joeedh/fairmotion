#!/usr/bin/env python3

import note

import os, sys, os.path, time, random, math
import shelve, struct, io, imp, ctypes, re
import subprocess, shlex, signal
from ctypes import *
import imp, runpy
from math import floor
import zipfile

from dbcache import CachedDB

THENOTE = "note"

#normpath helper func
def np(path):
  return os.path.abspath(os.path.normpath(path))

sp = os.path.sep

REBUILD = 1
WASBUILT = 2

def py_ctrl_c_handler(ctrltype):
  print("handler!", ctrltype)
  
  if ctrltype != 0: return 0
  return -1;
  
def ignore_ctrl_c():
  return
  k32 = windll.kernel32
  #"""
  print(k32.SetConsoleCtrlHandler.argtypes)
  k32.SetConsoleCtrlHandler(ctrl_c_handler1, c_int(1));
  #"""
  return
  
  STD_INPUT_HANDLE = 0xfffffff6
  handle = k32.GetStdHandle(STD_INPUT_HANDLE);
  print("handle", handle)
  ENABLE_PROCESSED_INPUT = 0x0001
  
  print(POINTER(c_int)(c_long(handle)));
  
  st = (c_int*2)();
  k32.GetConsoleMode(handle, st)
  mode = st[0]
  print("value1 ", st[0]);
  
  #if mode & ENABLE_PROCESSED_INPUT:
  print("result", k32.SetConsoleMode(c_long(handle), c_int(ENABLE_PROCESSED_INPUT)))
  
  st = (c_int*2)();
  mode = k32.GetConsoleMode(handle, st)
  print("value2 ", st[0]);
  
  
sep = os.path.sep
def modimport(name):
  cwd = os.path.abspath(os.path.normpath(os.getcwd()))
  path = cwd + sep + name + ".py"
  
  mfile = open(path, "r")
  mod = imp.load_module(name, mfile, path, ('.py', 'r', imp.PY_SOURCE)) #runpy.run_path(cwd + sep + path + ".py")
  
  return mod

try:
  a = FileNotFoundError
except:
  FileNotFoundError = IOError

def config_tryimp(name):
  try:
    mod = modimport(name)
  except (IOError, FileNotFoundError):
    return {}
  return mod.__dict__

config_dict2 = config_tryimp("js_sources")
config_dict = config_tryimp("build_local")

def validate_cfg(val, vtype):
  if vtype == "bool":
    if type(val) == str:
      return val.lower() in ["0", "1", "true", "false", "yes", "no"]
    elif type(val) == int:
      return val in [0, 1]
    else: return val in [True, False]
  elif vtype == "int":
    return type(val) in [int, float] and floor(val) == val
  elif vtype == "path":
    return os.path.exists(val)
  
  else: return True

localcfg = {}
localcfg_core = {}
def getcfg_intern(key, default, type, env, localcfg):
  if key in env:
    val = env[key]
    if not validate_cfg(val, type):
      raise RuntimeError("Invalid value for " + key + ": " + str(val))
    
    localcfg[key] = val
    
    return val
  return default

def getcfg(key, default, type):
  return getcfg_intern(key, default, type, config_dict, localcfg)

def getcorecfg(key, default, type):
  return getcfg_intern(key, default, type, config_dict2, localcfg_core)

def addslash(path):
  while path.endswith("/"): path = path[:-2]
  while path.endswith("\\"): path = path[:-2]
  
  path += sep
  return path
  
num_cores = getcfg("num_cores", 5, "int")
do_minify = getcfg("do_minify", False, "bool")
do_smaps = getcfg("do_smaps", False, "bool")
do_coverage_profile = getcfg("do_coverage_profile", False, "bool")
do_smap_roots = getcfg("do_smap_roots", False, "bool")
aggregate_smaps = getcfg("aggregate_smaps", do_smaps, "bool")

build_path = getcorecfg("build_path", "build", "string")
target_path = getcorecfg("target_path", build_path, "string")
db_path = getcorecfg("db_path", ".build_db/", "string")

build_path = addslash(build_path)
target_path = addslash(target_path)
db_path = addslash(db_path)

if not os.path.exists(db_path):
  os.mkdir(db_path)

def np(path):
  return os.path.abspath(os.path.normpath(path))
  
open_dbs = {}
open_paths = {}
_pathmap = {}
_in_db_func = False

def open_db(path):
  global open_dbs, db_path, _pathmap, open_paths, _in_db_func
  
  path = db_path + path
  
  pathkey = np(path)
  if pathkey in open_paths:
    return open_paths[pathkey]
  
  _in_db_func = True
  db = CachedDB(shelve.open(path), pathkey)
  _in_db_func = False
  
  open_dbs[id(db)] = db
  open_paths[pathkey] = db
  _pathmap[id(db)] = pathkey
  
  return db
  
def close_db(db):
  _in_db_func = True
  db.close()
  _in_db_func = False
  
  del open_dbs[id(db)]
  del open_paths[_pathmap[id(db)]]
  del _pathmap[id(db)]

libc = None
def load_libc():
  global libc
  try:
    libc = cdll.msvcrt 
  except:
    try:
      i = 6
      base = "libc.so."
      while i <20:
        name = base + str(i)
        libc = LoadLibrary(name)
        if libc != undefined: break
        i += 1
    except:
      print("failed to load libc!")
      sys.exit(-1)
  print("loaded libc!")

open_dbs = {}
procs = []
signal_called = False
def signal_handler(signal1, stack):
  global open_dbs, signal_called
  
  if signal_called: return
  
  signal_called = True

  print("\n\n---==============================---")
  sys.stderr.write("signal caught; closing databases. . .\n")
  
  for db in open_dbs.values():
    print("----------- closing database. . .")
    db.close()
  
  open_dbs = {}
  
  sys.stderr.write("done.\n\n")
  
  #import traceback
  #traceback.print_stack()
  #traceback.print_last()

  sys.exit(-1)
  
if len(localcfg) > 0:
  print("build config:")
  keys = list(localcfg.keys())
  keys.sort()
  for key in keys:
    val = localcfg[key]
    print("  " + key + ": " + str(val)) 
    
  print("\n")

class Source:
  def __init__(self, f):
    self.source = f
    self.target = ""
    self.build = False
    
  def __str__(self):
    return self.source + ":" + self.target
    
  def __repr__(self):
    return str(self)
  
class Target (list):
  def __init__(self, target):
    list.__init__(self)
    self.target = target
    self.optional = False 
    
  def replace(self, a, b):
    self[self.index(a)] = b

srcmod = modimport("js_sources")

copy_targets = []
if hasattr(srcmod, "copy_targets"):
  for f1 in srcmod.copy_targets:
    tpath = "build"+sep+f1
    f2 = srcmod.copy_targets[f1]
    target = Target(tpath)
    
    s = Source(np(f2))
    s.target = tpath
    target.append(s)
    target.optional = False 
    
    copy_targets.append(target)

if hasattr(srcmod, "optional_copy_targets"):
  for f1 in srcmod.optional_copy_targets:
    tpath = "build"+sep+f1
    f2 = srcmod.optional_copy_targets[f1]
    target = Target(tpath)
    
    s = Source(np(f2))
    s.target = tpath
    target.append(s)
    target.optional = True
    
    copy_targets.append(target)

targets2 = srcmod.js_targets
targets = []
for k in targets2:
  targets.append(Target(k))
  for s in targets2[k]:
    targets[-1].append(Source(s))
    

db = None
db_depend = None

filter = ""
if len(sys.argv) > 1:
  if len(sys.argv) == 3:
    build_cmd = sys.argv[1].lower()
    filter = sys.argv[2]
  else:
    build_cmd = sys.argv[1].lower()
    if build_cmd not in ["build", "cleanbuild", "clean", "loop"]:
      filter = build_cmd
      build_cmd = "single"
else:
  filter = ""
  build_cmd = "build"

if build_cmd == "clean": build_cmd = "cleanbuild"
if not os.path.exists("build"):
  os.mkdir("build")

_fmap = {}
for t1 in targets:
  for f1 in t1:
    f1.source_abs = np(f1.source)
    _fmap[f1.source_abs] = f1
    
for t1 in targets:
  for i, f1 in enumerate(t1):
    if f1.source_abs in _fmap:
      t1[i] = _fmap[f1.source_abs]

#read sources
for t in targets:
  for f in t:
    if sp in f.source or "/" in f.source:
      f2 = os.path.split(f.source)[1]
    else:
      f2 = f.source
    f.target = build_path + f2;

win32 = sys.platform == "win32"
PYBIN = sys.executable
if PYBIN == "":
  sys.stderr.write("Warning: could not find python binary, reverting to default\n")
  PYBIN = "python3.2"

PYBIN += " "

PYBIN = getcfg("PYBIN", PYBIN, "path") + " "
JCC = getcfg("JCC", np("tools/extjs_cc/js_cc.py"), "path")
TCC = getcfg("TCC", np("tools/extjs_cc/js_cc.py"), "path")
print("using python executable \"" + PYBIN.strip() + "\"")

#minified, concatenated build
JFLAGS = " -dpr " # --no-expand-iterators "

if aggregate_smaps:
  JFLAGS += " -nref"

if do_minify:
  JFLAGS += " -mn"

if do_coverage_profile:
  JFLAGS += " -pc"

if do_smaps:
  JFLAGS += " -gm"
  if do_smap_roots:
    JFLAGS += " -gsr"

JFLAGS += getcfg("JFLAGS", "", "string")
TFLAGS = getcfg("TFLAGS", "", "string")

def cp_handler(file, target):
  if win32:
    return "copy %s %s" % (np(file), np(target)) #file.replace("/", "\\"), target.replace("/", "\\"))
  else:
    return "cp %s %s" % (file, target)

def svg_handler(file, target):
  return PYBIN + " tools/scripts/render_icons.py"
  
def jcc_handler(file, target):
  return PYBIN + "%s %s %s %s -np" % (JCC, file, target, JFLAGS)

def tcc_handler(file, target):
  return PYBIN + "%s %s" % (TCC, TFLAGS)

class Handler (object):
  def __init__(self, func, can_popen=True):
    self.use_popen = can_popen
    self.func = func
    
handlers = {
  r'.*\.js\b' : Handler(jcc_handler),
  r'.*\.html\.in\b' : Handler(tcc_handler),
  r'.*\.html\b' : Handler(cp_handler, can_popen=False),
  r'.*\.png\b' : Handler(cp_handler, can_popen=False),
  r'.*\.js_' : Handler(cp_handler, can_popen=False),
  r".*\.svg\b" : Handler(svg_handler, can_popen=True)
}

def iter_files(files):
  for f in files:
    abspath = os.path.abspath(os.path.normpath(f.source))
    yield [f.source, f.target, abspath, f.build]
    
#dest depends on src
def add_depend(dest, src):
  if not os.path.exists(src):
    sys.stderr.write("\n%s: Could not find include file\n\t%s!\n"%(dest, src))
    sys.exit(-1)
    
  src = os.path.abspath(os.path.normpath(src))
  dest = os.path.abspath(os.path.normpath(dest))
  
  if dest not in db_depend:
    db_depend[dest] = set()
  
  fset = db_depend[dest]
  fset.add(src)
  
  db_depend[dest] = fset
  
def build_depend(f):
  if f.endswith(".png"): return
  
  prof_start("build_depend")
  file = open(f, "r")

  for line in file.readlines():
    if not (line.strip().startswith("#") and "include" in line and '"' in line):
      continue
    
    line = line.strip().replace("\n", "").replace("\r", "")
    
    i = 0
    in_str = 0
    filename = ""
    word = ""
    while i < len(line):
      c = line[i]
      if c in [" ", "\t", "#"]:
        i += 1
        continue
      elif c == '"':
        if in_str:
          break
        else:
          in_str = True
      elif c == "<" and not in_str:
        in_str = True
      elif c == ">" and in_str:
        in_str = False
        break
      else:
        if in_str:
          filename += c
        else:
          word += c
      i += 1
    add_depend(f, filename)
    
  prof_end("build_depend")

def safe_stat(path):
  #try:
  return os.stat(path).st_mtime
  #except OSError:
  #  return random()*(1<<22)
  #except IOError:
  #  return random()*(1<<22)
    
def do_rebuild(abspath, targetpath):
  prof_start("do_rebuild")
  
  global db, db_depend
  
  fname = os.path.split(abspath)[1]
  
  if not os.path.exists(targetpath) and not targetpath.endswith(".svg"):
    print("Missing: ", targetpath)
    return True
    
  if "[Conflict]" in abspath: 
      prof_end("do_rebuild")
      return False
  
  if build_cmd in ["filter", "single"] and fname.lower() not in filter:
    prof_end("do_rebuild")
    return False
  
  if abspath not in db or build_cmd in ["cleanbuild", "single"]:
    prof_end("do_rebuild")
    #print("not in db!", abspath)
    
    return True
  
  if safe_stat(abspath) != db[abspath]:
    prof_end("do_rebuild")
    print("time update!", abspath)
    
    return True
  
  if abspath in db_depend:
    #build_depend(abspath)

    if abspath not in db_depend:
      prof_end("do_rebuild")
      return False
    
    for path2 in db_depend[abspath]:
      if path2 in db and safe_stat(path2) != db[path2]:
        print("time update!", path2)
        prof_end("do_rebuild")
        return True
        
      elif path2 not in db:
        prof_end("do_rebuild")
        return True
    
  prof_end("do_rebuild")
  return False

def failed_ret(ret):
  return ret != 0

_profs = {}
def prof_reset():
  global _profs
  _profs = {}
  
def print_profs():
  for name in _profs:
    print(name, _profs[name][0])
    
def prof_start(name):
  global _profs
  if name not in _profs:
    _profs[name] = [0, 0, 0]
  
  p = _profs[name]
  if p[1] > 0:
    p[1] += 1
    return
  
  p[2] = time.time()
  p[1] += 1
  
def prof_end(name):
  if name not in _profs:
    print("Warning: bad call to prof_end for profile name", name)
    return
  
  p = _profs[name]
  p[1] -= 1
  
  if p[1] == 0.0:
    p[0] += time.time() - p[2]
  
def filter_srcs(files):
  global db, db_depend
  
  procs = []
  time_start()
  
  db = open_db("jbuild.db")
  db_depend = open_db("jbuild_dependencies.db")
  
  if build_cmd == "cleanbuild":  
    print("CLEAN BUILD!")
    
    for k in db:
      db[k] = 0;
    db.sync();
  
  i = 0;
  for f, target, abspath, rebuild in iter_files(files):
    fname = os.path.split(abspath)[1]
    
    if not do_rebuild(abspath, np(target)):
      i += 1
      continue
      
    files[i].build = REBUILD
    build_depend(abspath);
    i += 1
  
  close_db(db)
  close_db(db_depend)
  
def build_target(files):
  global db, db_depend, procs
  
  db = open_db("jbuild.db")
  db_depend = open_db("jbuild_dependencies.db")
  
  if build_cmd == "cleanbuild":  
    print("CLEAN BUILD 2!")
    
    for k in db:
      db[k] = 0;
    db.sync();
  
  built_files = []
  failed_files = []
  fi = 0
  
  filtered = list(iter_files(files))
  build_final = False
  first = True
  
  for f, target, abspath, rebuild in filtered:
    fname = os.path.split(abspath)[1]
    sf = files[fi]
    fi += 1
    
    build_final |= rebuild in [REBUILD, WASBUILT]
    if rebuild != REBUILD: continue
    
    if first:
        first = False
        if note.hasNote(THENOTE):
            note.endNote(THENOTE)
        startNote(THENOTE, "Build System", "Starting Build")
        
    sf.build = WASBUILT
    
    built_files.append([abspath, safe_stat(abspath), f])
    pathtime = built_files[-1];
    
    re_size = 0
    use_popen = None
    for k in handlers:
      if re.match(k, f) and len(k) > re_size:
        cmd = handlers[k].func(np(f), np(target))
        use_popen = handlers[k].use_popen
        re_size = len(k)
    
    perc = int((float(fi) / len(filtered))*100.0)
    
    """
    dcmd = cmd.replace(JCC, "js_cc").replace(PYBIN, "")
    dcmd = dcmd.split(" ")
    dcmd2 = ""
    for n in dcmd:
      if n.strip() == "": continue
      n = n.strip()
      if "/" in n or "\\" in n:
        n = os.path.split(n)[1]
      dcmd2 += n + " "
    dcmd = dcmd2  
    """
    
    dcmd = os.path.split(f)[1] if ("/" in f or "\\" in f) else f
    print("[%i%%] " % perc, dcmd)
    
    #startNote(THENOTE, "Build System", "Starting Build")
    changeNote(THENOTE, "[%i%%] %s" % (perc, dcmd))
    
    #execute build command
    while len(procs) >= num_cores:
      newprocs = []
      for p in procs:
        if p[0].poll() == None:
          newprocs.append(p)
        else:
          ret = p[0].returncode
          if failed_ret(ret):
            failed_files.append(p[1])
          else:
            print("done!", p[2][0], p[2][1])
            db[p[2][0]] = p[2][1]
            
      procs = newprocs
      note.sleep(0.75)
    
    if len(failed_files) > 0: continue
   
    if use_popen:
      #shlex doesn't like backslashes
      if win32:
        cmd = cmd.replace("\\", "/")
      else:
        cmd = cmd.replace("\\", "\\\\")
      
      print(cmd);
      cmdlist = shlex.split(cmd)
      #cmdlist[0] = np(cmdlist[0])
      proc = subprocess.Popen(cmdlist)
      procs.append([proc, f, pathtime])
    else:
      print(cmd)
      ret = os.system(cmd)
      
      if failed_ret(ret):
        failed_files.append(f)
      else:
        db[pathtime[0]] = pathtime[1]
  
  while len(procs) > 0:
    newprocs = []
    for p in procs:
      if p[0].poll() == None:
        newprocs.append(p)
      else:
        ret = p[0].returncode
        if failed_ret(ret): #ret in [-1, 65280]:
          failed_files.append(p[1])
    procs = newprocs

    note.sleep(0.75)
    
  if len(failed_files) > 0:
    clearNote(THENOTE);
    changeNote(THENOTE, "Build Failed")
    note.sleep(1);

    print("build failure\n\n")
    
    for f in failed_files:
      for i, f2 in enumerate(built_files):
        if f2[2] == f: break
      
      built_files.pop(i)

    for pathtime in built_files:
      db[pathtime[0]] = pathtime[1]
    
    close_db(db)
    close_db(db_depend)

    if build_cmd != "loop":
      sys.exit(-1)
    else:
      return 0

  if build_final:
    clearNote(THENOTE);
    ensureNote(THENOTE, "Build System", "Finished target");
    note.sleep(1.0);

  for pathtime in built_files:
    if pathtime[0] in db:
      print("saving", db[pathtime[0]], pathtime[1])
    
    db[pathtime[0]] = pathtime[1]
  
  close_db(db)
  close_db(db_depend)
  
  #write aggregate, minified file
  if build_final:
    print("\n\nwriting %s..." % (target_path+files.target))
    sys.stdout.flush()
    aggregate(files, target_path+files.target)
    print("done.")

    #ensureNote(THENOTE, "Build System", "Finished target");
    #note.sleep(1.0);

  if build_cmd != "loop":
    print("build finished")
    
  return build_final

def aggregate_multi(files, outpath=target_path+"app.js", maxsize=350*1024):
  files2 = []
  
  bootstrap_modules = {
    'coverage.js',
    'polyfill.js',
    'module.js',
    'typesystem.js',
    'util.js',
    'const.js',
    'config.js',
    'config_local.js',
  }
  
  bootstrap = ""
  
  totsize = 0
  for f in files:
    if not f.source.endswith(".js") and not f.source.endswith(".js_"): continue
    
    fname = os.path.split(f.source)[1]
    if fname in bootstrap_modules:
      file = open(f.target, "r")
      buf = file.read()
      bootstrap += buf + "\n"
      file.close()
      
      continue;
      
    #st = os.stat(f.target)
    #totsize += st.st_size
    file = open(f.target, "r")
    buf = file.read()
    file.close()
    files2.append(f)
    totsize += len(buf)
  
  totchunk = max(floor(totsize/maxsize), 1);
  
  fname = os.path.split(outpath)[1];
  if fname.endswith(".js"):
    fname = fname[:-3]
    
  c = 0;
  fi = 0;
  
  outbuf = ""
  for f in files2:
    file = open(f.target, "r")
    buf = file.read()
    file.close()
    
    c += len(buf)
    if c > maxsize:
      path  = target_path+fname+str(fi)+".js"
      do_write = True 
      
      if os.path.exists(path):
        out = open(path, "r")
        buf2 = out.read()
        out.close()
        
        do_write = buf2 != outbuf
      
      c = 0
      fi += 1
      
      if do_write:
        out = open(path, "w")
        out.write(outbuf)
        out.close()
        
      outbuf = ""
    
    outbuf += buf
  
  path  = target_path+fname+str(fi)+".js"
  do_write = True
  if os.path.exists(path):
    out = open(path, "r")
    buf2 = out.read()
    out.close()
    
    do_write = buf2 != outbuf 
  
  if do_write:
    out = open(path, "w")
    out.write(outbuf)
    out.close()
  
  fi += 1
  
  print(totchunk)
  file = open(outpath, "w")
  file.write(bootstrap + """
    var totfile=TOTFILE, fname="FNAME";
    for (var i=0; i<totfile; i++) {
      var path = "/fcontent/"+fname+i+".js";
      var node = document.createElement("script")
      node.src = path
      node.async = false
      
      document.head.appendChild(node);
    }
  """.replace("TOTFILE", str(fi)).replace("FNAME", fname))
  
  file.close()
  
def aggregate(files, outpath=target_path+"app.js"):
  aggregate_multi(files, outpath)
  return;
  
  outfile = open(outpath, "w")
  
  if aggregate_smaps:
    f = open(build_path+"srclist.txt", "w")
    for p in files:
      if not p.source.endswith(".js"): continue
      f.write(p.target+".map"+"\n")
    f.close()
    
  sbuf = """{"version" : 3,
  "file" : "app.js",
  "sections" : [
  """

  for f in files:
    if not f.source.endswith(".js") and not f.source.endswith(".js_"): continue
    
    f2 = open(f.target, "r")
    buf = f2.read()
    if "-mn" in JFLAGS and "\n" in buf:
      print("EEK!!", f)

    outfile.write(buf)
    outfile.write("\n")
    f2.close()
  
  if do_smaps:
    si = 0
    for f in files:
      if not f.source.endswith(".js"): continue
      
      smap = f.target + ".map"
      if si > 0:
        sbuf += ",\n"

      line = si
      col = 0
      url = "/content/" + os.path.split(smap)[1]

      f2 = open(smap, "r")
      map = f2.read()
      f2.close()

      sbuf += "{\"offset\": {\"line\":%d, \"column\":%d}, \"map\": %s}" % \
            (line, col, map)
      si += 1

    sbuf += "]}\n"
  
  if do_smaps:
    outfile.write("//# sourceMappingURL=/content/" + os.path.split(outpath)[1] + ".map\n")
  
  outfile.close()
  
  if aggregate_smaps:
    mapfile = open(outpath+".map", "w")
    mapfile.write(sbuf)
    mapfile.close()


def do_copy_targets():
  global copy_targets
  global db, db_depend
  
  db = open_db("jbuild.db")
  db_depend = open_db("jbuild_dependencies.db")
  
  build_final = False
  
  try:
    for f in copy_targets:
      abspath = np(f.target)
      src = f[0].source
      
      if f.optional and not os.path.exists(f[0].source):
        continue
      
      fname = f[0].source
      if (os.path.sep in fname):
        fname = os.path.split(fname)[1]
        
      stat = safe_stat(f[0].source)
      skip = not (abspath not in db or db[abspath] < stat)
      skip = skip and not build_cmd == "clean";
      skip = skip and not (build_cmd == "single" and  filter.lower() in abspath.lower())
      skip = skip and not (build_cmd == "single" and  filter.lower() in f[0].source.lower())
      
      if skip:
        continue

      build_final = True
      
      #db[abspath] = stat
      cmd = cp_handler(src, abspath)
      print(cmd)
      ret = os.system(cmd)
      
      if ret == 0:
        db[abspath] = stat
      else:
        print("build failure\n\n")

        sys.stderr.write("build failure\n");
        if build_cmd != "loop":
          sys.exit(-1)
        else:
          break
  except:
    import traceback
    
    db.close()
    db_depend.close()
    
    traceback.print_stack()
    traceback.print_last()
  
  return build_final

def build_platforms():
    from platforms import build
    
    build.build()

def build_chrome_package():
  print("Building chrome app. . .")
  
  zf = zipfile.ZipFile("chromeapp.zip", "w")

  if not os.path.exists("./chromeapp/fcontent/"):
    os.makedirs("./chromeapp/fcontent/")
    
  for f in os.listdir("./chromeapp"):
    path = "./chromeapp/" + f
    if f == "fcontent": continue
    
    zf.write(path, f);
    
  for f in os.listdir("./chromeapp/icons"):
    path = "./chromeapp/icons/" + f
    
    zf.write(path, "icons/"+f);
    
  
  print("  copying files")
  for f in os.listdir("./build"):
    if not f.startswith("chrome") and f.endswith(".js"):
      continue;
    
    path = "build/" + f
    file = open(path, "rb")
    buf = file.read()
    file.close()
    
    zf.write(path, "fcontent/" + f);
    
    path = "chromeapp/fcontent/" + f
    file = open(path, "wb")
    file.write(buf)
    file.close()
  
  print("done")
  
def build_package():
  print("Building fairmotion_alpha.zip. . .")
  zf = zipfile.ZipFile("fairmotion_alpha.zip", "w")
  
  def zwrite(path):
    zf.write(path, "fairmotion_alpha/"+path)
    
  zwrite("build/app.js")
  apath = "build/app0.js"
  i = 1
  while os.path.exists(apath):
    zwrite(apath)
    apath = "build/app%i.js" % i
    i += 1
  
  zwrite("examples/male character.fmo")
  zwrite("examples/scene.fmo")
  zwrite("examples/wip_animation.fmo")
  
  target = None
  for t in targets:
    if t.target == "app.js":
      target = t
      break
  
  for f in target:
    if not os.path.exists(f.target): continue
    
    if not f.target.lower().endswith(".js"):
      zwrite(f.target)
   
  for f in os.listdir("pyserver"):
    if f != "config_local.py" and (f.endswith(".py") or f.endswith(".sql")):
      zwrite("pyserver/"+f)
  run_simple = """#!/usr/bin/env python
#!/usr/bin/env python
import os, os.path, sys

path = os.path.abspath(os.path.normpath(os.getcwd()))

os.chdir("pyserver")
sys.path.append(os.getcwd())

if not os.path.exists("config_local.py"):
  print("generating config_local.py...")
  buf = \"""
serverhost = "127.0.0.1"
serverport = 8080

base_path = "/"
server_root = r"ROOT/pyserver"
doc_root = r"ROOT"

#this isn't used unless you turn off serv_all_local
files_root = r"ROOT/userfiles"

ipaddr = "127.0.0.1"
  \""".replace("ROOT", path)
  f = open("config_local.py", "w")
  f.write(buf)
  f.close()
  
import serv_simple
"""
  
  zf.writestr("fairmotion_alpha/run.py", run_simple)
  zf.writestr("fairmotion_alpha/src/core/config_local.js", """'use strict';
  //local config file
  """);
  
  zf.close()
  print("done.")
  
_timestart = []
def time_start():
  global _timestart
  _timestart.append(time.time())

def time_end():
  global _timestart
  t = _timestart.pop(-1);
  return time.time() - t

def py_lowlevel_signal(signal1):
  return 0


def buildall():
  try:
    buildall_intern()
  except KeyboardInterrupt:
    pass
    signal_handler(None, None)

note_timer = time.time()

def checkNote():
    global note_timer
    
    if not note.hasNote(THENOTE):
        return
        
    if time.time() - note_timer > 1.5:
        note.endNote(THENOTE)

def changeNote(id, msg):
    global note_timer
    note_timer = time.time()
    
    note.changeNote(id, msg)
    
def startNote(id, title, msg):
    global note_timer
    note_timer = time.time()
    
    note.startNote(id, title, msg)

def ensureNote(id, title, msg):
    if not note.hasNote(id):
        note.startNote(id, title, msg)
    else:
        note.changeNote(id, msg)

def clearNote(id):
    if note.hasNote(id):
        note.clearNote(id);

def buildall_intern():

  for t in targets:
    for s in t:
      s.build = False;
  
  for t in targets:
    filter_srcs(t)
  
  build_final = False
  
  for t in targets:
    build_final |= build_target(t)
  
  build_final |= do_copy_targets()
  
  if build_final:    
    build_platforms()

    clearNote(THENOTE);
    ensureNote(THENOTE, "Build System", "Finished Build");
    note.sleep(3.0);

def themain():  
  #print("         themain!", build_cmd)
  if build_cmd == "loop":
    ignore_ctrl_c()
    while 1:
      prof_reset()
      
      start = time.time();
      buildall()
      #print_profs()
      
      checkNote();
      
      t = time.time() - start
      #note.sleep(0.25)
      #"""

      if (t < 1.5):
        note.sleep(1.5 - t+0.1);
      else:
        note.sleep(0.1);
      #"""
  else:
    buildall()

if __name__ == "__main__":
  ret = 0
  try:
    themain()
  except KeyboardInterrupt:
    signal_handler(None, None)
    ret = -1
  
  print("main exit!")
  sys.exit(ret)
