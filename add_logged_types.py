import os, sys, os.path
import js_sources

files = []
for f in js_sources.sources:
    if "path.ux" in f: continue
    if not f.endsWith(".js"): continue

    