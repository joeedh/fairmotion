import os, sys, os.path
import re, traceback
import argparse, base64, json
import runpy
import js_fix_module_refs
from js_global import glob, Glob

def error():
  sys.stderr.write("usage: js_fix_all_module_refs.py --dir src --sources js_sources.py \n")
  sys.exit(-1)

def main(sources):
  for f in sources:
    if f.lower().endswith(".png") or f.lower().endswith(".jpg") or f.lower().endswith(".wasm"):
      continue

    print("processing", os.path.split(f)[1])
      
    sys.stdout.flush()
    sys.stderr.flush()
    
    glob.reset()

    try:
      js_fix_module_refs.main(f, sources)
    except:
      traceback.print_stack()
      traceback.print_last()
      print("Error processing", f)
  
if __name__ == "__main__":
  cparse = argparse.ArgumentParser(add_help=False)
  cparse.add_argument("--sources", help="js_sources.py file")
  cparse.add_argument("--dir", help="directory to (recursively) process")
  
  args = cparse.parse_args()
  
  if not os.path.exists(args.sources) or not os.path.exists(args.dir):
    error()
    
  js_sources = runpy.run_path(args.sources)["sources"]
  sources = set();

  for f in js_sources:
    f = os.path.abspath(os.path.normpath(f))
    sources.add(f)
  
  main(sources)
  