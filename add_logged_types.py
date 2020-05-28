import os, sys, os.path
import js_sources

files = []
for f in js_sources.sources:
    if "path.ux" in f: continue
    if not f.endswith(".js"): continue

    command = "python tools\extjs\js_cc.py -gtl -at --type-file electron_build/mytypes.json " + f

    print(command)
    print(os.system(command), "<---")
    break
