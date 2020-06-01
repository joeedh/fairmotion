import js_sources
import os, os.path, sys, time, random

for f in js_sources.sources:
    if not f.lower().endswith(".js"): continue
    if "path.ux" in f: continue

    f1 = f

    f = "tsrc/" + f

    f = os.path.abspath(os.path.normpath(f))
    dir = os.path.split(f)[0]

    os.makedirs(dir, exist_ok=True)

    f = f[:-2] + "ts"

    file = open(f1, "rb")
    buf = file.read()
    file.close()

    file2 = open(f, "wb")
    file2.write(buf)
    file2.close()

    sys.stdout.flush()
    sys.stderr.flush()
    #os.makedirs(
