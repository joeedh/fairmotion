#!/usr/bin/env python3
import sys, os.path, os, time, stat, struct, ctypes, io, subprocess, math, random, difflib
import ply, re, traceback
import argparse, base64, json

from js_lex import plexer
from js_global import glob, Glob, termColor

from js_ast import *
from js_parse import parser, print_err
from js_preprocessor import preprocess_text
from js_comment import *

def syntaxColor(s):
  s2 = ""
  bs = set(["{", "}", "[", "]", "(", ")"])
  ops = set(["-", "=", "+", ",", "*", ".", "/", "!", "|", "^", "&", "%", "~"])
  
  import re
  

  def chr1(i):
    return i
    #return chr(i+16)
    s = ""
    for j in range(i):
      s += "@"

    return s
    i = str(i)
    
    return str(i)

  base = 0
  colors = {
    "teal" : chr1(base+1),
    "orange" : chr1(base+2),
    "blue" : chr1(base+3),
    "peach" : chr1(base+4),
    "green" : chr1(base+5),
    "yellow" : chr1(base+6),
    "lightred" : chr1(base+7),
    "gray" : chr1(base+7),
    "white" : chr1(base+8),
    "lightblue" : chr1(base+9)
  };
  rcolors = {}

  for k in colors:
    rcolors[colors[k]] = k
  
  map = [-1 for x in range(len(s))]

  for i in range(len(s)):
    c = s[i]

    if c in bs:
      map[i] = colors["gray"]
    elif c in ops:
      map[i] = colors["orange"]

  def mid():
    id = _midgen[0]
    _midgen[0] += 1

    id = "_" + str(id) + "_"

    return id
  
  _clr = ["blue"]

  #[\n\r=\t \(\),\{\}\[\]]
  keyword = re.compile(r"(?<=\b)(var|let|export|import|from|of|in|as|const|switch|enum|return|break|continue|case|static|private|public|default|class|constructor|if|else|extends|super|do|while|for|try|catch|finally|of|in|undefined|null|function|=>)(?=\b)")
  string = re.compile(r'(".*")|(\'.*\')|(`.*`)')
  call = re.compile(r'([a-zA-Z0-9_]+)(?=\()')
  args = re.compile(r'(?<=[,\()])[ a-zA-Z0-9_]+(?=[,\)])')
  thisvar = re.compile(r"(?<=\b)(this)(?=\b)")

  def repl(arg):
    start = arg.start()
    end = arg.end()

    for i in range(start, end):
      map[i] = colors[_clr[0]]

    return arg.string[arg.start():arg.end()]

  _clr[0] = "yellow"; re.sub(args, repl, s)
  _clr[0] = "green"; re.sub(call, repl, s)
  _clr[0] = "blue"; re.sub(keyword, repl, s)
  _clr[0] = "peach"; re.sub(string, repl, s)
  _clr[0] = "lightblue"; re.sub(thisvar, repl, s)

  s2 = ""
  for i in range(len(s)):
    c = s[i]
    if map[i] < 0:
      s2 += termColor(c, "reset")
    else:
      s2 += termColor(c, rcolors[map[i]])
  return s2

plexer.lineno = 0

forloop_expansion_exclude = set(["__get_iter", "__get_iter2"])

class NoExtraArg:
  pass

def combine_try_nodes(node):
  return

  def error(msg, srcnode):
    if glob.g_print_stack:
      pass #traceback.print_stack()

    lines = glob.g_lexdata.split("\n")
    s = max(srcnode.line - 30, 0)
    e = min(srcnode.line + 3, len(lines)-1)
    ls = ""
    for i in range(s, e):
        ls += str(i+1) + ": " + lines[i] + "\n"

    sys.stderr.write("\n%s\n%s:(%s): error: %s\n"%(ls, srcnode.file, srcnode.line+1, msg))
    sys.exit(-1)

  def visit(n):
    if type(n.parent) == TryNode: return
    
    sl = n.parent

    i = sl.children.index(n)
    i -= 1
    
    #we remove n here, since we may have to ascend through
    #several layers of StatementList nodes
    #sl.children.remove(n)
    
    p = n.parent 
    lastp = n
    
    while p and type(p) == StatementList:
      print(p.get_line_str())
      
      if lastp is not None and type(p) == StatementList:
        i = max(p.index(lastp)-1, 0)
         
        if type(p[i]) == TryNode:
          p = p[i]
          break;
        elif type(p[i]) != StatementList:
          n = p

          error("%s:(%d): error: orphaned catch block 1\n" % (n.file, n.line), n)
          sys.exit(-1)
          
                  
      lastp = p
      p = p.parent
    
    if type(p) != TryNode or len(p) >= 2:
      n = p
      error("%s:(%d): error: orphaned catch block 2\n" % (n.file, n.line), n)
      sys.exit(-1)
    
    n.parent.remove(n)
    p.add(n)
    return
    
  traverse(node, CatchNode, visit, copy_children=True)

def combine_if_else_nodes(node):
  vset = set()
  found = [False];
  
  def visit(n):
    if type(n.parent) == IfNode: return
    
    if n in vset: return;
    vset.add(n);
    
    sl = n.parent

    i = sl.children.index(n)
    #i -= 1
    
    #we remove n here, since we may have to ascend through
    #several layers of StatementList nodes
    sl.children.remove(n)
    
    #clamp i
    i = max(min(i, len(sl)-1), 0);
    #print(len(sl), i)
    while 1:
      while i >= 0 and i < len(sl):
        if type(sl[i]) == IfNode:
          break

        i -= 1
      
      if i >= 0 or null_node(sl.parent): break
      
      i = sl.parent.children.index(sl)
      sl = sl.parent
      
    if i < 0:
      sys.stderr.write("%s:(%d): error: orphaned else block\n" % (n.file, n.line))
      sys.exit(-1)
    
    tn = sl[i]
    while len(tn) > 2:
      tn = tn[2][0];
    tn.add(n)
    found[0] = True
    
  traverse(node, ElseNode, visit, copy_children=True)
  while found[0]:
    found[0] = False
    traverse(node, ElseNode, visit, copy_children=True)

def unpack_for_c_loops(node):
  start = node.children[0]
  
  if node.parent.parent == None: return
  p = node.parent.parent
  
  i = node.parent.parent.children.index(node.parent)
  node.replace(start, ExprNode([]));
  node.parent.parent.insert(i, start)
  start._c_loop_node = node
  
  if type(node.parent[1]) != StatementList:
    sl = StatementList()
    sl.add(node.parent[1])
    node.parent.replace(node.parent[1], sl)
  
  sl = node.parent[1]
  inc = node[2]
  node.replace(inc, ExprNode([]))
  sl.add(inc);
  
  def handle_continues(n):
    if type(n.parent) != StatementList:
      sl = StatementList()
      n.parent.replace(n, sl)
      sl.add(n)
    
    n.parent.insert(n.parent.index(n), inc.copy())
  
  traverse(node.parent, ContinueNode, handle_continues, exclude=[FunctionNode], copy_children=True)
  
  node.parent[1]
    
def fetch_int(data, i1):
  ret = None
  i2 = i1+1
  
  while i2 < len(data):
    if data[i2-1] in [" ", "\t", "\n", "\r", ".", "x", "e"]:
      break
    
    try:
      ret = int(data[i1:i2])
    except:
      break
    i2 += 1
  
  return ret, i2-1

def caniter(obj):
  try:
    iter(obj)
  except:
    return False
  return True

def js_parse(data, args=None, file="", flatten=True, 
             print_stack=True, start_node=None,
             print_warnings=False, exit_on_err=True,
             log_productions=False, validate=False):
  back = glob.copy()
  def safe_get(data, i):
    if i < 0: return ""
    elif i >= len(data): return ""
    
    return data[i]
  
  if args != None:
    if not isinstance(args, tuple) and not isinstance(args, list):
      if caniter(args) and not isinstance(args, Node) \
           and type(args) not in [str, bytes]:
        args = list(args)
      else:
        args = (args,) #encapsulate single arguments in a tuple
    
    i = 0
    ai = 0
    while i < len(data)-2:
      if data[i] == "$":
        if safe_get(data, i+1) == "$": #handle '$$'
          data = data[:i] + data[i+1:]
          i += 1
          continue
          
        i1 = i
        t = data[i+1]
        i += 2
        
        arg, i = fetch_int(data, i)
        if arg == None:
          arg = ai
          ai += 1
        else:
          arg -= 1
          ai = max(arg, ai)
        
        if arg >= len(args):
          raise RuntimeError("Not enough args for format conversion in js_parse()")
       
        if t == "n":
          buf = args[arg].gen_js(0)
        elif t == "s":
          buf = str(args[arg])
        elif t in ["d", "i", "u"]:
          buf = str(int(args[arg]))
        elif t in ["f", "lf"]:
          buf = str(float(args[arg]))
        elif t == "x":
          buf = hex(int(args[arg]))
        else:
          buf = data[i1:i]
          
        data = data[:i1] + buf + data[i:]
        
        i = i1 + len(buf)
        
      i += 1      
  
  glob.reset()
  glob.g_exit_on_err = exit_on_err
  glob.g_lexer = plexer
  linemap = glob.g_lexer.linemap
  glob.g_lexdata = data
  glob.g_production_debug = False
  glob.g_file = file
  glob.g_print_stack = print_stack
  glob.g_print_warnings = print_warnings
  glob.g_log_productions = log_productions
  glob.g_validate_mode = validate
  glob.g_inside_js_parse = True

  plexer.lineno = plexer.lexer.lineno = 0
  plexer.input(data)

  ret = None

  try:
    ret = parser.parse(data, lexer=plexer)
  except:
    pass

  glob.g_inside_js_parse = False
  glob.g_lexer.linemap = linemap

  if glob.g_error:
    ret = None

  if ret is None:
    ls = data.split("\n")
    s2 = ""
    for i in range(len(ls)):
        s2 += str(i+1) + ": " + ls[i] + "\n"
    print(s2)

    col = glob.g_lexpos
    i = min(col, len(data)-1)
    while i >= 0 and i < len(data) and data[i] != "\n":
        i -= 1

    if i > 0:
        col -= i
        pass

    i = max(i, 0)
    i2 = i+1

    while i2 < len(data) and data[i2] != "\n":
        i2 += 1

    #line = data.split("\n")[glob.g_line]
    if data[i] == "\n":
        line = data[i+1:i2]
    else:
        line = data[i:i2]

    while col < len(line) and col >= 0 and line[col] in ["\n", "\r", "\t", " "]:
        col += 1

    if col > 0 and col < len(line):

        line = line[:col] + termColor(line[col], 41) + line[col+1:]


    raise SyntaxError("(js_parse intern):"+str(glob.g_line+1) + ":" + str(col+1) + "\n\t" + line)

  if ret:
    flatten_statementlists(ret, None)

  if glob.g_clear_slashr:
    print("\n")
    
  def fix_parents(node, lastnode = None):
    if node.parent in [0, None]:
      node.parent = lastnode
    
    for c in node.children:
      fix_parents(c, node)
    
  if ret != None:
    fix_parents(ret)
    if flatten:
      ret = flatten_statementlists(ret, None)
      if ret == None:
        traceback.print_stack()
        sys.stderr.write("error: internal parse error within js_parse\n")
        sys.exit(-1)
        
  if start_node != None and ret != None:
    def visit(n):
      if type(n) == start_node:
        return n
        
      for c in n.children:
        c2 = visit(c)
        if c2 != None:
          return c2
      
    ret = visit(ret)
  
  if ret != None:
    combine_try_nodes(ret)
  
  glob.load(back)
  
  return ret

from js_typespace import *
from js_generators import *
from js_process_ast import traverse, traverse_i, null_node, \
                           find_node, flatten_statementlists, \
                           kill_bad_globals, expand_harmony_classes, create_class_list,\
                           transform_exisential_operators, flatten_var_decls_exprlists

from js_module import module_transform

from js_typed_classes import expand_typed_classes
from js_let import process_let

b64tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
def b64chr(n):
  global b64tab
  
  if n < 0 or n > 63:
    raise RuntimeError("Base64 number must be between 0 and 63")
  
  return b64tab[n]

b64tab2 = {}
for i, a in enumerate(b64tab):
  b64tab2[a] = i

def b64ord(c):
  global b64tab2
  
  if c not in b64tab2:
    raise RuntimeError("Base64 number must be between 0 and 63")
  
  return b64tab2[c]
  
_vlq_s = [0, 0, 0, 0, 0, 0, 0]
def vlq_encode(index):
  global _vlq_s
  
  index = int(index)
  
  sign = int(index < 0)
  index = abs(index)
  
  index = index << 1;
  index |= sign;
  
  a = index & 31
  b = (index>>5) & 31
  c = (index>>10) & 31
  d = (index>>15) & 31
  e = (index>>20) & 31
  f = (index>>25) & 31
  
  ar = _vlq_s
  ar[0] = a
  ar[1] = b
  ar[2] = c
  ar[3] = d
  ar[4] = e
  ar[5] = f

  i = 5
  while i > 0 and ar[i] == 0:
    i -= 1
  tot = i + 1
  
  out = ""
  i = 0
  while i < tot:
    n = ar[i]
    
    if i != tot-1:
      n |= 32
    
    c = b64chr(n)
    out += c
    i += 1
    
  return out

#returns new i
def vlq_decode(buf, i=0):
  val = 0
  n = 0
  while i < len(buf):
    c = b64ord(buf[i])
    val |= (c & 31)<<(n*5)
    
    n += 1
    i += 1

    if (c & 32) == 0: break
    
  if val & 1:
    val = -(val>>1)
  else:
    val = val>>1
    
  return i, val

#print(vlq_encode(231234))  
#sys.exit()

def parse_smap(smap):
  smap = json.loads(smap)
  
  map = smap["mappings"]
  i = 0
  
  lines = [[[]]]
  while i < len(map):
    c = map[i]
    if c == ",":
      lines[-1].append([])
    elif c == ";":
      lines.append([[]])
    else:
      i, val = vlq_decode(map, i)
      lines[-1][-1].append(val)
      i -= 1
      
    i += 1
  
  colsum = 0
  ocolsum = 0
  olinesum = 0
  sfile = 0
  
  #[col-lastcol, sourcefile, oline, ocol-lastocol]
  for l in lines:
    colsum = 0
    
    for seg in l:
      if len(seg) != 4:
        print("Unimplemented sourcemap type")
        raise RuntimeError("Unimplemented sourcemap type")
      
      colsum += seg[0]
      sfile += seg[1]
      olinesum += seg[2]
      ocolsum += seg[3]
      
      seg[0] = colsum;
      seg[1] = sfile
      seg[2] = olinesum
      seg[3] = ocolsum
  
  smap["mappings"] = lines
  return smap


def encode_smap(smap, lastocol=0, lastfile=0, lastoline=0):
  """
   encode raw smaps (not SourceMap objects,
   but objects generated by parsing json-encoded
   source maps
  """
  
  map = ""
  lines = smap["mappings"]
  
  lastcol = 0
  
  arr = [0, 0, 0, 0]
  i = 0
  itot = len(lines)
  while i < itot:
    l = lines[i]
    lastcol = 0
    
    if i > 0: map += ";"
    
    j = 0
    jtot = len(l)
    while j < jtot:
      seg = l[j]
      if j > 0: map += ","
      
      arr[0] = seg[0]-lastcol
      arr[1] = seg[1]-lastfile
      arr[2] = seg[2]-lastoline
      arr[3] = seg[3]-lastocol
      
      lastcol = seg[0]
      lastfile = seg[1]
      lastoline = seg[2]
      lastocol = seg[3]
      
      map += vlq_encode(arr[0]) + vlq_encode(arr[1]) + vlq_encode(arr[2]) + vlq_encode(arr[3])
      
      j += 1
    i += 1
    
  smap["mappings"] = map
  return smap

def concat_smaps(files):
  """
  concatenate non-index sourcemap files together
  """
  
  ret = {"file" : "app.js", "sources" : [], "sourceRoot" : "", "names" : []}
  giant_map = ""
  
  maxfile = 0
  maxoline = 0
  maxocol = 0
  maxcol = 0
  
  lastocol = 0
  lastoline = 0
  
  smaps = []
  start = True
  for fi, f in enumerate(files):
    file = open(f, "r")
    buf = file.read()
    file.close()
    smap = parse_smap(buf)
    
    print("Concatenating source map " + f + "...")
    lastocol2 = lastocol
    lastoline2 = lastoline
    
    for l in smap["mappings"]:
      for seg in l:
        seg[1] += maxfile
    
        lastoline2 = seg[2]
        lastocol2 = seg[3]
        
    ret["sources"] += smap["sources"]
    ret["names"] += smap["names"]
    
    lastfile = 0 if start else maxfile-1
    smap2 = encode_smap(smap, lastfile=lastfile, lastoline=lastoline, lastocol=lastocol)
    
    if not start: giant_map += ";"
    giant_map += smap2["mappings"]
    
    lastoline = lastoline2
    lastocol = lastocol2
    
    maxfile += len(smap["sources"])
    start = False
    
  ret["mappings"] = giant_map
  
  return ret
    
def gen_source_map(src, gensrc, map):
  #"""
  gensrc2 = ""
  for seg in map.segments:
    gensrc2 += seg[3]
  
  """
  print(gensrc2[0:175])
  
  raise JSError("bleh")
  return
  #"""
  
  #gensrc2 = gensrc
  
  basename = os.path.split(os.path.abspath(glob.g_file))[1]
  
  if glob.g_gen_smap_orig:
    orig = "/content/" + basename + ".origsrc"
  else:
    orig = ""
    
  js = """{
    "version": 3,
    "file" : "%s",
    "sourceRoot": "",
    "sources": ["%s"],
    "names": [],
    "mappings":
  """ % (basename, orig)
  
  segs2 = map.segments
    
  line_segs = [[]]
  for seg in segs2:
    text = seg[3]
    
    splits = []
    
    #"""
    while ("\n") in seg[3]:
      si = seg[3].rfind("\n")
      li = seg[0] + si
      
      if seg[si:] != "":
        splits.append([li, seg[1], len(seg[3])-si, seg[si:]])
      seg[3] = seg[3][:si]
    #"""
    
    splits.append(seg)
    splits.reverse()
    
    for i, s in enumerate(splits):
      if i == 0:
        line_segs[-1].append(s)
      else:
        line_segs.append([s])
  
  def get_col(lexpos, text):
    if len(line_segs) == 1:
      return lexpos
    
    i2 = 0
    while lexpos > 0 and text[lexpos] != "\n":
      i2 += 1
      lexpos -= 1
    return i2
  
  mapping = ""
  
  lastoline = 0
  lastocol = 0
  for i, line in enumerate(line_segs):
    if i != 0:
      mapping += ";"
      
    lastcol = 0
    for j, seg in enumerate(line):
      col = get_col(seg[0], gensrc)
      
      sourcefile = 0
      #filter out -1
      if seg[1].line == -1:
        seg[1].line = 0
        
      oline = seg[1].line - lastoline
      lastoline = seg[1].line
      
      if seg[1].line < 0:
        print(seg[1].line)
        print("YEEEK!!")
        
      ocol = get_col(seg[1].lexpos, src)
      
      vals = [col-lastcol, sourcefile, oline, ocol-lastocol]

      lastcol = col
      lastocol = ocol
      
      s = ""
      for v in vals:
        s += vlq_encode(v)
      
      if j != 0:
        mapping += ","
      mapping += s
  
  js += '"%s"\n}\n' % mapping
  
  if glob.g_outfile == "":
    print(js)
  else:
    file = open(glob.g_outfile + ".map", "w")
    file.write(js)
    file.close()
  return js

def check_for_preprocess():
  for i in range(5):
    if i >= len(glob.g_lines):
        break

    line = glob.g_lines[i]

    if line.startswith('"USE_PREPROCESSOR"') or line.startswith("'USE_PREPROCESSOR'"):
        glob.g_preprocess_code = True

def parse_intern_es6(data):
  glob.g_lines = data.split("\n")
  glob.g_filedata = data

  check_for_preprocess()

  if glob.g_preprocess_code:
    data = preprocess_text(data, glob.g_file)
    
  if glob.g_print_tokens:
    print("printing tokens")
    plexer.input(data)
    tok = plexer.token()
    while tok != None:
      print(tok)
      tok = plexer.token()
    plexer.input(data)
  
  glob.g_lexer = plexer
  result = parser.parse(data, lexer=plexer)
  
  if result == None:
    if glob.g_error_pre != None:
      glob.g_error = True
    
    result = StatementList()
  
  if glob.g_error:
    print_err(glob.g_error_pre)
  
  if glob.g_print_nodes:
    print(result)
  
  flatten_var_decls_exprlists(result, typespace)
  
  typespace = JSTypeSpace()
  
  #handle some directives
  for c in result:
    if type(c) != StrLitNode: break
    
    if c.val[1:-1] == "use strict":
      glob.g_force_global_strict = True
    elif c.val[1:-1] == "not_a_module":
      glob.g_es6_modules = False
    
  if glob.g_force_global_strict:
    kill_bad_globals(result, typespace)
  
  if glob.g_write_manifest and glob.g_outfile != "":
    buf = gen_manifest_file(result, typespace);
    file = open(glob.g_outfile+".manifest", "w")
    file.write(buf)
    file.close()
  
  if glob.g_include_comments:
    process_comments(result, typespace)
  
  if glob.g_enable_static_vars:
    process_static_vars(result, typespace)
  
  from js_format import format_es6
  buf = format_es6(result, typespace)
 
  if glob.g_outfile == "":
    print(syntaxColor(buf))
  
  return buf, result
  
def inside_generator(node):
  p = node
  while p.parent != None and not isinstance(p, FunctionNode):
    p = p.parent
  
  found = [0]
  def findyield(n):
    found[0] = 1
    
  traverse(p, YieldNode, findyield)
  
  return found[0]
  
def expand_of_loops(result, typespace):
  onIterEnd = """
      if (__re_t_.done && typeof __itervar_["return"] === "function") {
        __itervar_["return"]();
      }
  """
  
  def addIterEnds(node):
    def visit(n):
      sn = StatementList()
      sn.force_block = True
      
      n.parent.replace(n, sn)
      sn.add(js_parse(onIterEnd))
      sn.add(n)
      
    traverse(node, ReturnNode, visit)
    
  def expand_expand_loop(node, scope):
    
    sn = StatementList()
    sn.force_block = True
    
    n3 = None
    vdecl = None
    if node[0].etype == "array":
        namenode = BinOpNode(IdentNode("__re_t_"), IdentNode("value"), ".")
        for i, c in enumerate(node[0]):
            n4 = VarDeclNode(ArrayRefNode(namenode, NumLitNode(i)), name=c.val)
            if len(n4) == 1:
                n4.add(UnknownTypeNode())
            
            if n3 is None:
                n3 = n4
            else:
                n3.add(n4)
                
            if vdecl is None:
                vdecl = n3
            n3 = n4
    else:
        namenode = BinOpNode(IdentNode("__re_t_"), IdentNode("value"), ".")

        for i, c in enumerate(node[0]):
            n4 = VarDeclNode(BinOpNode(namenode, c, "."), name=c.val)
            if len(n4) == 1:
                n4.add(UnknownTypeNode())
            
            if n3 is None:
                n3 = n4
            else:
                n3.add(n4)
                
            if vdecl is None:
                vdecl = n3
            n3 = n4
    
    vdecl.modifiers = node[0].modifiers
    
    label = node.parent.label 
    label = "" if label is None else label
    
    innersn = StatementList()
    for c in node.parent[1:]:
      innersn.add(c)
      
    n2 = js_parse("""
        let __itervar_ = __get_iter($n1);
        let __re_t_ = __itervar_.next();
        $s4 for (; !__re_t_.done; __re_t_ = __itervar_.next()) {
            $n3;
            $n2;
        }
        
        $s5
    """, [node[1], innersn, vdecl, label+": " if len(label)>0 else "", onIterEnd])
    
        
    sn.add(n2)
    sn.force_block = True
    
    node.parent.parent.replace(node.parent, sn)
    addIterEnds(sn)
  
  Found = [0]

  def expand_mozilla_forloops_new(node, scope):
    if node.of_keyword != "of":
      return

    Found[0] = 1
    
    if type(node[0]) == ExpandNode:
        expand_expand_loop(node, scope)
        return
        
    vdecl = node[0]
    label = node.parent.label 
    label = "" if label is None else label + ":"
    
    name = vdecl.val
    if isinstance(name, Node):
      name = name.gen_js(0)
      
    innersn = StatementList()
    for c in node.parent[1:]:
      innersn.add(c)
    
    flatten_statementlists(innersn, typespace)
    #print(innersn)
      
    n2 = js_parse("""
        let __itervar_ = __get_iter($n1);
        let __re_t_ = __itervar_.next();
        $n3;
        $s5 for (; !__re_t_.done; __re_t_ = __itervar_.next()) {
          $s4 = __re_t_.value;
        
          $n2
        }
        
        $s6
    """, [node[1], innersn, vdecl, name, label, onIterEnd])
    sn = StatementList()
    sn.force_block = True
    sn.add(n2)

    #print("===============================>", sn.gen_js(0), "<==========================")
    
    node.parent.parent.replace(node.parent, sn)
    addIterEnds(sn)
    
  def old_expand_mozilla_forloops_new(node, scope):
    if type(node[0]) == ExpandNode:
        expand_expand_loop(node, scope)
        return
        
    use_in_iter = False
    
    if (node.of_keyword == "in"):
      use_in_iter = True
      
      if glob.g_warn_for_in:
        typespace.warning("Detected for-in usage", node);
      
      if not inside_generator(node):
        return
      
    func = node.parent
    while not null_node(func) and type(func) != FunctionNode: 
      func = func.parent
      
    if not null_node(func):
      if func.name in forloop_expansion_exclude: return
    
    def prop_ident_change(node, oldid, newid):
      if type(node) in [IdentNode, VarDeclNode] and node.val == oldid:
        if type(node.parent) == BinOpNode and node.parent.op == ".":
          if node != node.parent[1]:
            node.val = newid
        else:
            node.val = newid
        
      for c in node.children:
        if type(c) == FunctionNode:
          continue
        prop_ident_change(c, oldid, newid)
    
    #for-in-loops don't seem to behave like for-C-loops,
    #the iteration variable is in it's own scope, and 
    #doesn't seem to affect the parent scope.
    val = node[0].val
    di = 0
    while node[0].val in scope:
      node[0].val = "%s_%d" % (val, di)
      di += 1
      
      #print(node[0].val)
    
    if node[0].val != val:
      scope[node[0].val] = node[0]
      prop_ident_change(node.parent, val, node[0].val)
    
    slist = node.parent.children[1]
    if type(slist) != StatementList:
      s = StatementList()
      s.add(slist)
      slist = s
    
    getiter = "__get_in_iter" if use_in_iter else "__get_iter"
    
    label = node.parent.label 
    label = label+": " if label is not None else ""
    
    itername = node[0].val
    objname = node[1].gen_js(0)
    if glob.g_log_forloops:
      n2 = js_parse("""
        var __iter_$s1 = __get_iter($s2, $s3, $s4, $s5);
        var $s1;
        LABEL while (1) {
          var __ival_$s1 = __iter_$s1.next();
          if (__ival_$s1.done) {
            break;
          }
          
          $s1 = __ival_$s1.value;
        }
      """.replace("LABEL", label).replace("__get_iter", getiter), (itername, GETITER, objname, "'"+node[0].file+"'", node[0].line, "'"+node.of_keyword+"'"));
    else:
      n2 = js_parse("""
        var __iter_$s1 = __get_iter($s2);
        var $s1;
        LABEL while (1) {
          var __ival_$s1 = __iter_$s1.next();
          if (__ival_$s1.done) {
            break;
          }
          
          $s1 = __ival_$s1.value;
        }
      """.replace("LABEL", label).replace("__get_iter", getiter), (itername, objname));
    
    def set_line(n, slist, line, lexpos):
      n.line = line
      n.lexpos = lexpos
      
      for c in n.children:
          set_line(c, slist, line, lexpos)
    
    #preserving line info is a bit tricky.
    #slist goes through a js->gen_js->js cycle,
    #so make sure we still have it (and its
    #line/lexpos information).
    
    set_line(n2, slist, node.line, node.lexpos)
    for c in slist:
      n2[2][1].add(c)
    
    node.parent.parent.replace(node.parent, n2)

  #expand_of_loops lexical scope here    
  for i in range(1000):
    Found[0] = 0
    traverse(result, ForInNode, expand_mozilla_forloops_new, use_scope=True)
    if not Found[0]:
      break

f_id = [0]
def parse_intern(data, create_logger=False, expand_loops=True, expand_generators=True):
  glob.g_lines = data.split("\n")
  glob.g_filedata = data

  check_for_preprocess()

  if glob.g_preprocess_code:
    have_cpp = False

    for l in glob.g_lines:
        l = l.strip()
        if l.startswith("#"):
            have_cpp = True

    if have_cpp:
        data = preprocess_text(data, glob.g_file)
    
  if glob.g_print_tokens:
    plexer.input(data)
    tok = plexer.token()
    while tok != None:
      print(tok)
      tok = plexer.token()
    plexer.input(data)

  glob.g_lexer = plexer
  result = parser.parse(data, lexer=plexer, debug=glob.g_production_debug)
  
  if result == None:
    if glob.g_error_pre != None:
      glob.g_error = True
    
    result = StatementList()

  if glob.g_error:
    print_err(glob.g_error_pre)
    
  typespace = JSTypeSpace()
  glob.g_lexdata = data

  if glob.g_infer_class_properties:
    from js_process_ast import infer_class_properties
    data = infer_class_properties(result, typespace, glob.g_filedata)

    if glob.g_outfile == "":
        print(data)

    return data, result

  if glob.g_raw_code:
    buf = result.gen_js(0);
    if glob.g_outfile == "":
      print(syntaxColor(buf))

    return buf, result

  if 1: #glob.g_enable_let:
    process_let(result, typespace)
    pass

  flatten_var_decls_exprlists(result, typespace)

  if glob.g_type_file != "":
    if not os.path.exists(glob.g_type_file):
        sys.stderr.write("File does not exist: %s\n" % glob.g_type_file)
        sys.exit(-1)

    import json
    import js_typelogger

    file = open(glob.g_type_file, "r")
    buf = file.read()
    file.close()

    data2 = json.loads(buf)
    inserts = js_typelogger.load_types(result, typespace, data2)
    js_typelogger.emit_dynamic_literals(result, typespace, data2)


    if glob.g_apply_types:
        data = js_typelogger.apply_inserts(result, typespace, inserts, glob.g_filedata)
        if glob.g_outfile == "":
            print(data)

        return data, result

  if create_logger:
    import js_typelogger
    js_typelogger.create_type_logger(result, typespace)


  #handle some directives
  for c in result:
    if type(c) != StrLitNode: break

    if c.val[1:-1] == "use strict":
      glob.g_force_global_strict = True
    elif c.val[1:-1] == "not_a_module":
      glob.g_es6_modules = False

  if glob.g_profile_coverage:
    from js_process_ast import coverage_profile
    coverage_profile(result, typespace)

  if glob.g_compile_statics_only:
    process_static_vars(result, typespace)
    return result.gen_js(0), result

  if glob.g_force_global_strict:
    kill_bad_globals(result, typespace)
    pass

  #handle .? operator
  if glob.g_transform_exisential:
    transform_exisential_operators(result, typespace)

  if glob.g_write_manifest and glob.g_outfile != "":
    buf = gen_manifest_file(result, typespace);
    file = open(glob.g_outfile+".manifest", "w")
    file.write(buf)
    file.close()

  if glob.g_es6_modules:
    module_transform(result, typespace)
    pass

  #"""
  if glob.g_require_js:
    expand_requirejs_classes(result, typespace)
  elif glob.g_expand_classes:
    expand_harmony_classes(result, typespace)
    expand_typed_classes(result, typespace)
  else:
    create_class_list(result, typespace)
    pass
  #"""

  if glob.g_clear_slashr:
    print("\n")

  if result != None and len(result) == 0:
    result = None
    return "", None
    #sys.stdout.write("Error: empty compilation\n");
    #raise JSError("Empty compilation");

  global f_id
  f_id = [0]
  flatten_statementlists(result, typespace)

  has_generators = [False]
  def has_generator(n):
    if not glob.g_expand_generators: return

    if type(n) == YieldNode:
      has_generators[0] = True

    for c in n:
      has_generator(c)

  has_generator(result)

  if expand_loops or has_generators[0]:
    expand_of_loops(result, typespace)

  #combine_try_nodes may have nested statementlists again, so better reflatten
  flatten_statementlists(result, typespace)

  #don't need to do this anymore, yay!
  #process_arrow_function_this(result, typespace)

  if expand_generators:
    flatten_statementlists(result, typespace)
    process_generators(result, typespace);
    flatten_statementlists(result, typespace)

  if glob.g_add_opt_initializers:
    add_func_opt_code(result, typespace)

  debug_forloop_expansion = False
  if debug_forloop_expansion:
    reset = 0
    if reset or not os.path.exists("cur_d.txt"):
      f = open("cur_d.txt", "w")
      f.write("-1")
      f.close()

    f = open("cur_d.txt", "r")
    d = int(f.read())
    print("\n\nd: %d\n"%d)
    traverse_i(result, ForInNode, expand_mozilla_forloops, d, use_scope=True)
    f.close()

    f = open("cur_d.txt", "w")
    f.write(str(d+1))
    f.close()

  if glob.g_combine_ifelse_nodes:
    combine_if_else_nodes(result)

  if glob.g_print_nodes:
    print("nodes: ", result)
    pass

  if glob.g_replace_instanceof and not glob.g_require_js:
    replace_instanceof(result, typespace)

  if glob.g_enable_static_vars:
    process_static_vars(result, typespace)

  if glob.g_do_docstrings:
    process_docstrings(result, typespace)

  if glob.g_include_comments:
    process_comments(result, typespace)

  if glob.g_gen_source_map:
    smap = SourceMap()
    def set_smap(node, smap):
      node.smap = smap
      for n in node:
        set_smap(n, smap)

    set_smap(result, smap)

    if not glob.g_minify:
      buf = result.gen_js(0)
      map = gen_source_map(data, buf, smap);
    else:
      buf, smap = js_minify(result)
      map = gen_source_map(data, buf, smap)

    if glob.g_add_srcmap_ref:
      spath = glob.g_outfile
      if os.path.sep in spath: spath = os.path.split(spath)[1]

      buf += "\n//# sourceMappingURL=/content/%s\n"%(spath+".map")

    if glob.g_gen_smap_orig:
      f = open(glob.g_outfile + ".origsrc", "w")
      f.write(data)
      f.close()
  else:
    if not glob.g_minify:
      buf = result.gen_js(0)
    else:
      buf, smap = js_minify(result)

  if glob.g_outfile == "":
    sys.stdout.write(syntaxColor(buf) + "\n")

    if 0:
      file = open("generator_test.html", "w")
      file.write("""
      <html><head><title>Generator Test</title></head>
      <script>
      function arr_iter(keys)
      {
        this.keys = keys;
        this.cur = 0;

        this.next = function() {
          if (this.cur >= this.keys.length) {
            throw StopIteration;
          }

          return this.keys[this.cur++];
        }
      }

      __use_Iterator = true;

      function __get_iter(obj)
      {
        if (obj.__proto__.hasOwnProperty("__iterator__") || obj.hasOwnProperty("__iterator__")) {
          return obj.__iterator__();
        } else {
          if (__use_Iterator) {
            return Iterator(obj);
          } else {
            keys = []
            for (var k in obj) {
              keys.push(k)
            }
            return new arr_iter(keys);
          }
        }
      }

      function __get_iter2(obj)
      {
        if (obj.__proto__.hasOwnProperty("__iterator__") || obj.hasOwnProperty("__iterator__")) {
          return obj.__iterator__();
        } else {
          keys = []
          for (var k in obj) {
            keys.push([k, obj[k]])
          }
          return new arr_iter(keys);
        }
      }

      try {
        _tst = Iterator({});
      } catch (Error) {
        __use_Iterator = false;
        Iterator = __get_iter2;
      }
      FrameContinue = {1:1};
      FrameBreak = {2:2};
      """)
      file.write(buf.replace("yield", "return"))
      file.write("""
  j = 0;
  for (var tst in new range2(2, 8)) {
    if (_do_frame_debug) console.log(tst);
    if (j > 10)
      break;
    j++;
  }
  </script>
  </html>
  """)
      file.close()
    pass

  return buf, result

def add_newlines(data):
  data2 = ""

  tlvl = 0
  for c in data:
    data2 += c

    if c == "{": tlvl += 1
    if c == "}": tlvl -= 1

    if c == ";":
      data2 += "\n" + tab(tlvl)

  return data2

def parse(data, file=None, create_logger=False, expand_loops=True, expand_generators=None):
    if file != None: glob.g_file = file
    if expand_generators is None:
      expand_generators = glob.g_expand_generators

    if glob.g_add_newlines:
      data = add_newlines(data)
      #print(data[1017297])
      data = data.replace("\\n", "\n")
      for l in data.split("\n"):
        try:
          print(l)
        except UnicodeEncodeError:
          pass
      return data, StatementList()

    try:
      if glob.g_gen_es6:
        return parse_intern_es6(data)
      else:
        return parse_intern(data, create_logger=create_logger, expand_loops=expand_loops, expand_generators=expand_generators)
    except JSError:
      if glob.g_print_stack:
        traceback.print_stack()
        traceback.print_exc()

      glob.g_error = True
      return "", None

def test_regexpr():
  from js_regexpr_parse import parser as rparser, rlexer
  data = r"/[ \t]+/g+"
  re_part = re.match(r"/.+/[a-zA-Z0-9_$]*", data)

  span = re_part.span()
  buf = data[span[0]:span[1]]
  #print(buf)
  buf = rparser.parse(buf, lexer=rlexer)
  #print(buf)

from js_minify import *

def main():
    cparse = argparse.ArgumentParser(add_help=False)

    glob.add_args(cparse)
    cparse.add_argument("--help", action="help", help="Print this message")

    args = cparse.parse_args()
    glob.parse_args(cparse, args)

    glob.g_outfile = args.outfile

    #test_regexpr()
    #return 1

    glob.g_file = args.infile

    if args.infile == None:
        print("js_cc.py: no input files")
        return -1

    f = open(args.infile, "rb")
    data = f.read()
    data = str(data, "latin-1")

    data = data.replace("\r", "")
    f.close()

    doloops = not glob.g_emit_code and glob.g_expand_iterators
    
    if glob.g_refactor_mode:
      from js_refactor import refactor
      buf, node = refactor(data)
      if args.outfile == "":
        print(syntaxColor(buf))
    elif glob.g_gen_log_code:
      buf, node = parse(data, expand_loops=doloops, create_logger=True)
    else:
      buf, node = parse(data, expand_loops=doloops)
        
    if glob.g_emit_code:
      import js_type_emit
      js_type_emit.emit(node)
      
    if not glob.g_error:
      if args.outfile != "":
        f = open(args.outfile, "w")
        f.write(buf)
        f.close()
    else:
      return -1
    
    return 0

if __name__ == "__main__":
    import io, traceback
    
    try:
      ret = main()
    except SystemExit:
      ret = -1
    except KeyboardInterrupt:
      ret = -1
    except:
      traceback.print_stack()
      traceback.print_exc()
      ret = -1
    
    sys.exit(ret)
