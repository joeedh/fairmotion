import os, sys, os.path
import js_sources

files = []
crfiles = set()

for f in js_sources.sources:
    if "path.ux" in f: continue
    if not f.endswith(".js"): continue

    file = open(f, "rb")
    buf = file.read()
    file.close()

    count1 = buf.count(b"\n")
    count2 = buf.count(b"\r")
    has_cr = count2 >= count1*0.8

    command = "c:/Python38/python.exe tools/extjs_cc/js_cc.py -gtl -at --type-file electron_build/mytypes.json " + f + " " + f

    file = open(f, "rb")
    buf = file.read()
    file.close()

    if has_cr:
        buf = buf.replace(b"\r", b"")
        buf = buf.replace(b"\n", b"\r\n")
        file = open(f, "wb")
        file.write(buf)
        file.close()

    #ret = os.system(command)
    #print(ret, "<---")

    #break
    sys.stdout.flush()
    sys.stderr.flush()

