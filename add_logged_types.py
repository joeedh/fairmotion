import os, sys, os.path
import js_sources

files = []
for f in js_sources.sources:
    if "path.ux" in f: continue
    if not f.endswith(".js"): continue

    command = "c:/Python38/python.exe tools/extjs_cc/js_cc.py -gtl -at --type-file electron_build/mytypes.json " + f + " " + f

    print(f)
    print(os.system(command), "<---")

    #break
    sys.stdout.flush()
    sys.stderr.flush()
