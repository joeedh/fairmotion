import js_lex
import js_global
from js_global import glob 

import argparse, sys

def process(buf):
    lexer = js_lex.plexer
    lexer.input(buf)

    tokens = []

    t = lexer.token()
    while t is not None:
        tokens.append(t)
        t = lexer.token()
    
    #"""
    for t in tokens:
        print(t)
    #"""

def main():
    cparse = argparse.ArgumentParser()
    glob.add_args(cparse);
    args = cparse.parse_args()

    path = args.infile
    glob.g_file = path

    file = open(path, "r")
    buf = file.read()
    file.close()

    process(buf)

if __name__ == "__main__":
    main()
