import config, sys

if not config.is_set("use_sqlite"):
  config.use_sqlite = True
  
if not config.is_set("serv_local"):
  config.serv_local = True
  
if not config.is_set("serv_all_local"):
  config.serv_all_local = True #allow full access to local filesystem

from config import *
import mimetypes

def bstr(s):
  if type(s) == bytes:
    return s
  return bytes(str(s), "latin-1")
def mime(path):
  return mimetypes.guess_type(path)
  
if sys.version_info.major > 2:
  from http import *
  from http.server import *
else:
  from httplib import *
  from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler

from logger import elog, mlog, alog
import os, sys, os.path, math, random, time, io, gc
import shelve, imp, struct, ctypes
import mimetypes

from auth import AuthAPI_RefreshToken_WPHack, AuthAPI_OAuthStart, AuthAPI_GetUserInfo, AuthAPI_RefreshToken, AuthAPI_SessionToken
from fileapi import FileAPI_DirList, FileAPI_GetMeta, FileAPI_UploadStart, FileAPI_UploadChunk, FileAPI_GetFile

import config, json

from api import api_handlers

import db_engine

proxy_cls = """
class ObjProxy (object):
  def __init__(self, obj, methodmap):
    self.methodmap = methodmap
    self.proxy = obj
    
  def __getattribute__(self, attr):
    if attr.endswith("_override"):
      attr = attr[:len(attr)-len("_override")]
      proxy = object.__getattribute__(self, "proxy")
      return object.__getattribute__(proxy, attr)
      
    #print("GETATTR")
    proxy = object.__getattribute__(self, "proxy")
    methodmap = object.__getattribute__(self, "methodmap")
    
    #print(methodmap)
    if attr in methodmap:
      methodmap[attr](attr)
    
    return object.__getattribute__(proxy, attr)
"""

specials = [
  "__str__", "__repr__", "__len__", ["__getitem__", "item"], 
  ["__setitem__", "item, val"], ["__hasitem__", "item"],
  ["__eq__", "b"], "__hash__", "__iter__", ["__neq__", "b"],
  ["__contains__", "item"], ["__delitem__", "item"],
  ["__lt__", "b"], ["__gt__", "b"], ["__le__", "b"], ["__ge__", "b"]
]

for k in specials:
  args1 = args2 = ""
  if type(k) in [list, tuple]:
    k, args = k
    args1 = ", " + args
    args2 = args
    
  proxy_cls += """
  def K(selfARGS1):
    attr = "K"
    proxy = object.__getattribute__(self, "proxy")
    methodmap = object.__getattribute__(self, "methodmap")
    
    if attr in methodmap:
      methodmap[attr](attr)
    
    return object.__getattribute__(proxy, attr)(ARGS2)
  """.replace("K", k).replace("ARGS1", args1).replace("ARGS2", args2)

exec(proxy_cls)

class ReqHandler (BaseHTTPRequestHandler):
  def __init__(self, *args):
    BaseHTTPRequestHandler.__init__(self, *args)

  def _on_write(self, attr):
    #print("on_write!", self._sent_headers)
    
    if not self._sent_headers:
      self._sent_headers = True
      self.end_headers()
    
  def end_headers(self, *args):
    self._sent_headers = True
    BaseHTTPRequestHandler.end_headers(self, *args)
    
  def format_err(self, buf):
    if type(buf) == bytes: buf = str(buf, "latin-1")
    
    header = """
      <!DOCTYPE html><html><head><title>Build Error</title></head>
      <body><h1>Build Failure</h1><h3>
    """
    footer = """
      </h3>
      </body>
    """
    
    ret = ""
    for b in buf:
      if b == "\n": ret += "<br />"
      if b == " ": ret += "&nbsp"
      if b == "\t": ret += "&nbsp&nbsp"
      ret += b
    
    return (header + ret + footer).encode()
  
  def set_ipaddr(self):
    adr = self.client_address
    if type(adr) != str and len(adr) == 2:
      adr = str(adr[0]) + ":" + str(adr[1])
    else:
      adr = str(adr)
		
    config.client_ip = adr

  def start_Req(self):
    self.orig_wfile = self.wfile
    
    self._sent_headers = False
    self.wfile = ObjProxy(self.wfile, {"write" : self._on_write})
    self.set_ipaddr()
  
  def do_GET(self):
    self.start_Req()
    
    alog("GET " + self.path)
    
    if "Connection" in self.headers:
      keep_alive = self.headers["Connection"].strip().lower() == "keep-alive"
    else:
      keep_alive = False
    
    wf = self.wfile
    body = [b"yay, tst"]
    
    print(self.path)
    
    if self.has_handler(self.path):
      self.exec_handler(self.path, "GET")
      return
    elif self.path.strip() == "/" or self.path.strip() == "":
      path = doc_root + "/build/main.html"
    else:
      path = self.path.strip()
      if not path.startswith("/fcontent/"):
        self.send_error(404)
        return 
          
      if ".." in path or ":" in path:
        self.send_error(503)
        return
        
      path = os.path.normpath(doc_root + self.path.replace("/fcontent/", "/build/"))
    
    if not os.path.exists(path):
      self.send_error(404)
      return
    
    f = open(path, "rb")
    
    csize = 1024*1024
    ret = f.read(csize)
    body = [ret];
    while ret not in ["", b'', None]:
      ret = f.read(csize);
      body.append(ret);
      
    f.close()
    
    if type(body) == str:
      body = [bytes.decode(body, "latin-1")]
    elif type(body) == bytes:
      body = [body]
    
    bodysize = 0
    for chunk in body:
      bodysize += len(chunk)
    
    if path.strip().endswith(".js"):
      mm = "application/javascript"
    else:
      mm = mime(path)[0]
      
    self.gen_headers("GET", bodysize, mm);
    
    b = b""
    for chunk in body:
      b += chunk
    
    wf.write(b);
    
    #for chunk in body:
    #  wf.write(chunk);
  
  def has_handler(self, path):
    for k in api_handlers:
      if path.startswith(k): return True
    return False
  
  def exec_handler(self, path, op):
    handler = None
    
    #find matching handler with largest prefix
    for k in api_handlers:
      if path.startswith(k):
        if handler == None or len(k) > len(handler):
          handler = k
        
    if handler != None:
      getattr(api_handlers[handler](), "do_"+op)(self)
    else:
      print("ERROR: bad handler", path, op)
      
  def restart(self):
    global restart_server
    #restart_server = True
    
    print("\nRestarting Server...\n")
    
    self.server.shutdown()
        
    
  def do_POST(self):
    self.start_Req()
    
    self.set_ipaddr()
    path = self.path
    
    alog("POST " + self.path)
    
    if self.has_handler(path):
      self.exec_handler(path, "POST")
    else:
      self.send_error(404)
  
  def do_PUT(self):
    self.start_Req()
    
    alog("PUT " + self.path)
    self.set_ipaddr()
    path = self.path
    
    if self.has_handler(path):
      self.exec_handler(path, "PUT")
    else:
      self.send_error(404)
  
  def send_header(self, *args):
    wf = self.wfile
    
    self.wfile = self.orig_wfile
    ret = BaseHTTPRequestHandler.send_header(self, *args)
    self.wfile = wf
    
    return ret
    
  def gen_headers(self, method, length, type, extra_headers={}):
    #if type == "text/html":
    #  type = "application/xhtml"
      
    self.wfile.write_override(bstr(method) + b" http/1.1\r\n")
    
    self.send_header("Content-Type", type)
    self.send_header("Content-Length", length)

    if "Via" in self.headers:
      uri = "http://"+serverhost+self.path
      
      print("Got 'Via':", uri)
      alog("Got 'Via': " + str(uri));
      
      self.send_header("Content-Location", uri)
    
    for k in extra_headers:
      self.send_header(k, extra_headers[k])
    
    if "Via" in self.headers:
      pass
      #self.send_header("Via", self.headers["Via"])
    
    #self.send_header("Connection", "close")
    #self.send_header("Host", serverhost)
    self.send_header("Server-Host", serverhost)
    #self.end_headers()
  
  def send_error(self, code, obj=None):
    if obj != None:
      msg = json.dumps(obj)
      BaseHTTPRequestHandler.send_error(self, code, msg)
    else:
      BaseHTTPRequestHandler.send_error(self, code)
    
    return
    if obj == None: obj = {}
    obj["result"] = 0
    obj["error"] = code
    
    self.code = code
    self.codemsg = "ERR"

    body = json.dumps(obj)
    
    self.gen_headers("GET", len(body), "application/x-javascript")    
    self.wfile.write(bstr(body))

import sqlite_db
if not os.path.exists("database.db"):
  print("initializing database...")
  sqlite_db.default_db()

"""
cur, con = sqlite_db.sql_connect()

cur.execute("INSERT INTO users (username,name_first,name_last,password,email,permissions) VALUES ('user2','','',7,'{SHA}2jmj7l5rSw0yVb/vlWAYkK/YBwk=','me@localhost');");
con.commit()

res = cur.execute("SELECT * FROM ussers")
for row in res:
  print(row)
sys.exit()
#"""

restart_server = True
while restart_server:
  restart_server = False
  
  server = HTTPServer((serverhost, serverport), ReqHandler);
  #server.socket = ssl.wrap_socket(server.socket, certfile=certpath, keyfile="privateKey.key")
  
  print("running on port", serverport)
  server.serve_forever()

