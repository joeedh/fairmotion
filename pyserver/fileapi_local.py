from logger import elog, mlog, alog
from db_engine import mysql_connect, mysql_reconnect, get_qs, \
                     estr, valid_pass, SQLParamError, sql_selectall, \
                     sql_insertinto, do_param_error, sq, sql_update
import random, time, json, os, os.path, sys, math, types
from utils import *
from math import *
from auth import do_auth, gen_token, toktypes, rot_userid, unrot_userid
import datetime
from config import *
from db_engine import *
import db_engine
import base64
import os, os.path, sys, stat

WIN32 = sys.platform.startswith("win")

if not WIN32: #unix functions; need to test these!
  def unixnorm(path):
    #strip out '.', so ./path works
    while path[0] == ".":
      path = path[1:]
    return path 
    
  def listdir(path):
    path = unixnorm(path)
    
    return os.listdir(path)
  
  def exists(path):
    path = unixnorm(path)
    return os.path.exists(path)
    
  def dostat(path):
    path = unixnorm(path)
    return os.stat(path)
    
  def local_to_real(path):
    path = unixnorm(path)
    if not serv_all_local:
      path = files_root + os.path.sep + path
    
    return os.path.abspath(os.path.normpath(path))
  
  def real_to_local(path):
    path = unixnorm(path)

    path = os.path.abspath(os.path.normpath(path))
    froot = os.path.abspath(os.path.normpath(files_root))
    path = path[len(froot):].replace(os.path.sep, "/")
    
    return path

if WIN32:
  import win_util
  
  local_to_real = win_util.local_to_real
  real_to_local = win_util.real_to_local
  listdir = win_util.listdir
  dostat = win_util.dostat
  exists = win_util.exists
    
FOLDER_MIME = "application/vnd.google-apps.folder"

import fileapi_db

ROOT_PARENT_ID = fileapi_db.ROOT_PARENT_ID

def is_folder(file):
  return file.mimeType == FOLDER_MIME or file.id == ROOT_PARENT_ID

def is_valid_file(file):
  return file["realpath"] != EMPTY_TAG

class FileClass (dict):
  #metadata is added automatically from DB keys
  def __init__(self, path, userid):
      print("  FCLS PATH", path, userid)
      
      path = os.path.normpath(path).replace(os.path.sep, "/")
      
      diskpath = local_to_real(path)
      froot = local_to_real("/")

      try:
        nstat = dostat(diskpath)
      except FileNotFoundError:
        self.bad = True
        return
          
      rootid = fileapi_db.fileid_to_publicid(userid, ROOT_PARENT_ID)
      
      if stat.S_ISDIR(nstat.st_mode):
        mime = FOLDER_MIME
        self.is_dir = True
      else:
        mime = "application/x-javascript"
        self.is_dir = False
      
      self.name = ""
      self.bad = False
      
      if not serv_all_local and not diskpath.startswith(froot):
        elog("Error! " + diskpath)
        print("Error!", diskpath, froot)
        self.bad = True
        return 

      self.diskpath = diskpath

      self.mimeType = mime
      self.id = fileid_to_publicid(path, userid)
      
      print("Final relative path:", path, len(froot));
      
      oname = path
      while len(oname) > 0 and oname[0] in ["\\", "/"]:
        oname = oname[1:]
        
      name = oname[oname.rfind("/")+1:].strip()
      name = name.replace("/", "")
      
      if name == "":
        name = oname
      
      self.name = name
      print("Final name:", self.name)
      
      parentpath = path[:path.rfind("/")].strip()
      if "/" not in path:
        parentpath = "/"
        
      print("PARENT PATH", "'"+parentpath+"'", fileid_to_publicid(parentpath, userid))
      
      if name == "/" or parentpath == "/" or parentpath == "":
        self.parentid = rootid 
      else:
        self.parentid = fileid_to_publicid(parentpath, userid)
        
def File(path, userid):
  f = FileClass(path, userid)
  if f.bad: return None
  return f
  
#for local serving, encode file path as the id  
def fileid_to_publicid(path, userid):
  if ".." in path: return "-1"
  
  path = bytes(path, "latin-1")
  path = str(base64.b64encode(path), "latin-1")
  return path 

def publicid_to_fileid(publicid):
  if len(publicid) == 17:
    userid, fileid = fileapi_db.publicid_to_fileid(publicid)
    if fileid == ROOT_PARENT_ID:
      return "/"
  
  if publicid == "/":
    return publicid
  
  print(":::", publicid)
  path = base64.b64decode(bytes(publicid, "latin-1"));
  path = str(path, "latin-1")
  
  if ".." in path: return "-1"
  
  return path 
  
class FileAPI_DirList:
  basepath = "/api/files/dir/list"
  
  def __init__(self):
    pass
  
  def do_GET(self, serv):
    qs = get_qs(serv.path)
    if "accessToken" not in qs or ("path" not in qs and "id" not in qs):
      serv.send_error(400)
      return
    
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      elog("Invalid access in file api")
      serv.send_error(401)
      return
    
    if "id" in qs:
      path = publicid_to_fileid(qs["id"][0])
    else:
      path = qs["path"]
    
    print(path);
    
    dir = File(path, userid)
    
    if ".." in path:
      serv.send_error(401)
      return 
    
    if not serv_all_local:
      prefix = files_root#+rot_userid(userid)
      try:
        os.makedirs(prefix)
      except FileExistsError:
        pass
        
    dirpath = local_to_real(path)
    
    files = []
    for f in listdir(dirpath):
      path2 = path + os.path.sep + f
      file = File(path2, userid)
      f = {}
      
      #if file == None: continue
      
      f["name"] = file.name
      f["id"] = file.id
      f["mimeType"] = file.mimeType
      f["is_dir"] = file.is_dir
      f["parentid"] = file.parentid;
      
      files.append(f)
    
    body = json.dumps({"items": files})
    body = bstr(body)
    
    serv.gen_headers("GET", len(body), json_mimetype)
    serv.wfile.write(body)

class FileAPI_MakeFolder:
  basepath = "/api/files/dir/new"
  
  def __init__(self):
    pass
  
  def do_GET(self, serv):
    qs = get_qs(serv.path)
    if "name" not in qs or "accessToken" not in qs or ("path" not in qs and "id" not in qs):
      serv.send_error(400)
      return
    
    if ".." in qs["name"][0]:
      serv.send_error(403)
      return
      
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      serv.send_error(401)
      return
    
    if "id" in qs:
      folderid = publicid_to_fileid(qs["id"][0])
    else:
      folderid = qs["path"][0]
    
    if folderid == None:
      serv.send_error(400)
      return
    
    path = local_to_real(folderid + "/" + qs["name"][0])
    
    print("PATH", path, exists(path))
    #see if folder (or a file) already exists
    if exists(path):
      serv.send_error(400)
      return 
    
    os.makedirs(path)
    
    body = json.dumps({"success": True})
    body = bstr(body)
    
    serv.gen_headers("GET", len(body), json_mimetype)
    serv.wfile.write(body)

class FileAPI_GetMeta:
  basepath = "/api/files/get/meta"
  
  def __init__(self):
    pass
  
  def do_POST(self, serv):
    buf = serv.rfile.read()
    try:
      obj = json.loads(buf)
    except:
      self.send_error(401)
      return
  
  def do_GET(self, serv):
    qs = get_qs(serv.path)
    
    if "accessToken" not in qs or ("path" not in qs and "id" not in qs):
      serv.send_error(400)
      return
    
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      serv.send_error(401)
      return
    
    if "path" in qs:
      fileid = resolve_path(qs["path"][0])
    else:
      fileid = publicid_to_fileid(qs["id"][0])[1]
    
    if fileid == None:
      serv.send_error(400)
    
    if fileid == None:
      serv.send_error(400)
    
    f = fetch_file(fileid)
    if f == None:
      serv.send_error(400)
      return
    
    if f["userid"] != userid:
      serv.send_error(401)
      return
    
    f2 = {}
    for k in f:
      if k in file_restricted_fields: continue
      
      if k == "fileid":
        f2["id"] = fileid_to_publicid(fileid, userid)
        continue
      if k == "other_meta" and f[k] != "" and f[k] != None:
        try:
          meta = json.loads(f[k])
        except ValueError:
          meta = {}
        
        for k2 in meta:
          f2[k2] = estr(meta[k2])
        continue
      
      f2[k] = estr(f[k])
        
    f2["is_dir"] = f2["mimeType"] == FOLDER_MIME
    
    body = json.dumps(f2)
    body = bstr(body)
    
    serv.gen_headers("GET", len(body), json_mimetype)
    serv.wfile.write(body)

class UploadStatus:
  def __init__(self, uploadToken=None):
    self.invalid = False
    
    if uploadToken != None:
      self.from_sql(uploadToken)
  
  def from_sql(self, utoken):
    cur, con = mysql_connect()
    
    try:
      qstr = sql_selectall("uploadtokens", ["tokenid"], [utoken], [sq.token])
    except SQLParamError:
      do_param_error("UploadToken.from_sql")
      raise SQLParamError()
    
    #qstr = "SELECT * FROM uploadtokens WHERE tokenid="+estr(utoken)
    
    cur.execute(qstr)
    ret = cur.fetchone()
    
    if ret == None:
      self.invalid = True
      return
    
    self.token = ret["tokenid"]
    self.path = ret["path"]
    self.time = ret["time"]
    self.name = ret["name"]
    self.fileid = ret["fileid"]
    self.realpath = ret["realpath"]
    self.userid = ret["userid"]
    self.permissions = ret["permissions"]
    self.expiration = ret["expiration"]
    self.size = ret["size"]
    self.cur = ret["cur"]
  
  def toJSON(self):
    obj = {}
    for k in this.__dict__:
      val = getattr(self, k)
      if type(val) in [types.MethodType, types.FunctionType]: continue
      
      obj[k] = getattr(self, k)
      
    return obj
    
  def commit(self):
    cur, con = mysql_connect()
    
    dnow = datetime.datetime.now()
    dend = datetime.datetime.now()+datetime.timedelta(days=1)
    
    types   = [sq.token,   sq.path,       sq.datetime, sq.int     ]
    cols    = ["tokenid",  "path",        "time",      "fileid"   ]
    values  = [self.token, self.path,     dnow,        32423423] #we don't use database fileids in local mode
    
    types  += [sq.str(100), sq.path,       sq.int,      sq.int       ]
    cols   += ["name",      "realpath",    "userid",    "permissions"]
    values += [self.name,   self.realpath, self.userid, 0            ]
    
    types  += [sq.datetime,  sq.int,    sq.int  ]
    cols   += ["expiration", "size",    "cur"   ]
    values += [dend,         self.size, self.cur]
    
    try:
      qstr = sql_insertinto("uploadtokens", cols, values, types)
    except SQLParamError:
      #do_param_error(json.dumps(self));
      raise SQLParamError("upload token error; see error.log for details")
      
    """
    qstr = "INSERT INTO uploadtokens (tokenid,path,time,fileid,"
    qstr += "name,realpath,userid,permissions,expiration,size,cur) VALUES"
    qstr += "(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)" % (
      estr(self.token),
      estr(self.path),
      estr(datetime.datetime.now()),
      estr(self.fileid),
      estr(self.name),
      estr(self.realpath),
      estr(self.userid),
      estr(0),
      estr(datetime.datetime.now()+datetime.timedelta(days=1)),
      estr(self.size),
      estr(self.cur),
    )
    #"""
    
    cur.execute(qstr)
    con.commit()
    
  def create(self, token, path, userid, fileid, parentid=ROOT_PARENT_ID):
    self.token = token
    self.path = path
    
    cs = os.path.split(path)
    self.dir = cs[0];
    self.time = time.time();
    
    self.size = -1
    self.cur = 0
    self.file = None
    self.file_init = False
    
    self.fileid = fileid
    self.userid = userid;
    self.parentid = parentid; #note: not cached in database
    
    if len(cs) == 1 or cs[1] == "" or cs[1] == None:
      self.name = cs[0]
    else:
      self.name = cs[1]
    
    self.gen_realpath()
    
  def gen_realpath(self):
    f = File(self.fileid, self.userid)
    
    fpath = os.path.split(f.diskpath)[0]
    if not os.path.exists(fpath):
      os.makedirs(fpath)
    
    self.realpath = f.diskpath
    
    return f.diskpath
    
class FileAPI_UploadStart:
  basepath = "/api/files/upload/start"  
  
  def __init__(self):
    pass
  
  def do_GET(self, serv):
    elog("fileapi access" + serv.path)
    
    qs = get_qs(serv.path)
    if "accessToken" not in qs or ("path" not in qs and "id" not in qs):
      serv.send_error(400)
      return
    
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      elog("Need user id")
      print("Bad auth")
      serv.send_error(401)
      return
    
    path = qs["path"][0]
    
    if "id" in qs:
      fileid = publicid_to_fileid(qs["id"][0])
    else:
      fileid = path
    
    meta = File(fileid, userid)
    if meta == None or not os.path.exists(meta.diskpath):
      elog("creating new file")
      
      cs = os.path.split(path)
      folderid = cs[0]
      
      f = File(folderid, userid)
      if not os.path.exists(f.diskpath):
        elog("invalid folder " + f.diskpath)
        print("invalid folder " + f.diskpath)
        serv.send_error(401);
        return
      
      if len(cs) == 1 or cs[1] == "":
        fname = cs[0]
      else:
        fname = cs[1]
      
      mime = "application/octet-stream"
      
      #create empty file
      f = open(f.diskpath+"/"+fname, "w")
      f.close()
      
      meta = File(fileid, userid)
    
    if meta == None:
      elog("Invalid file id")
      serv.send_error(400)
      return
    
    print("\n\nFILE", meta, "\n\n")
    if is_folder(meta):
      elog("target file is a folder" + meta["name"])
      serv.send_error(401)
      return
    
    utoken = gen_token("U", userid);
    
    ustatus = UploadStatus()
    
    #ignore fileid/parentid in upload status token
    ustatus.create(utoken, path, userid, fileid, -1)
    ustatus.commit()
    
    f = open(ustatus.realpath, "w");
    f.close();
    
    realpath = ustatus.realpath
    
    body = json.dumps({"uploadToken" : utoken});
    body = bstr(body)
    
    print("\nupload start result:", body, "\n\n\n")
    
    serv.gen_headers("GET", len(body), json_mimetype)
    serv.wfile.write(body)

cur_uploads = {}
class FileAPI_UploadChunk:
  basepath = "/api/files/upload"  
  
  def __init__(self):
    pass
  
  def do_PUT(self, serv):
    alog("fileapi access" + serv.path)
    
    qs = get_qs(serv.path)
    if "accessToken" not in qs or "uploadToken" not in qs:
      elog("fileapi: invalid tokens")
      serv.send_error(400)
      return
    
    tok = qs["accessToken"][0]
    utoken = qs["uploadToken"][0]
    
    userid = do_auth(tok)
    
    if userid == None:
      elog("invalid authorization")
      serv.send_error(401)
      return
    
    status = UploadStatus(utoken)
    if status.invalid:
      elog("invalid upload token ", utoken)
      serv.send_error(401)
      return
      
    if "Content-Range" not in serv.headers:
      elog("missing header " + json.dumps(serv.headers))
      serv.send_error(400)
      return
      
    r = serv.headers["Content-Range"].strip()
    
    if not r.startswith("bytes"):
      elog("malformed request 1")
      serv.send_error(400)
      return
    
    r = r[len("bytes"):].strip()
    r = r.split("/")
    
    if r == None or len(r) != 2:
      elog("malformed request 2")
      serv.send_error(400)
      return
    
    try:
      max_size = int(r[1])
    except ValueError:
      elog("malformed request 3")
      serv.send_error(400)
      return
    
    r = r[0].split("-")
    
    if r == None or len(r) != 2:
      elog("malformed request 4")
      serv.send_error(400)
      return
    
    try:
      r = [int(r[0]), int(r[1])]
    except ValueError:
      elog("malformed request 4")
      serv.send_error(400)
      return
    
    if r[0] < 0 or r[1] < 0 or r[0] >= max_size or r[1] >= max_size \
      or r[0] > r[1]:
      elog("malformed request 5")
      serv.send_error(400)
      return
    
    if status.size == -1:
      status.size = max_size
    
    buflen = r[1]-r[0]+1
    buf = serv.rfile.read(buflen)
    
    if len(buf) != buflen:
      elog("malformed request 6")
      serv.send_error(400)
      return
    
    if r[0] == 0:
      mode = "wb"
    else:
      mode = "ab"
    
    status.file = open(status.realpath, mode);
    status.file.seek(r[0]);
    status.file.write(buf);
    status.file.flush()
    status.file.close()
    
    status.commit()
    
    body = json.dumps({"success" : True});
    body = bstr(body)
    
    serv.gen_headers("PUT", len(body), json_mimetype)
    serv.wfile.write(body)

class FileAPI_GetFile:
  basepath = "/api/files/get"
  
  def __init__(self):
    pass
  
  def do_GET(self, serv):
    qs = get_qs(serv.path)
    if "accessToken" not in qs or ("path" not in qs and "id" not in qs):
      serv.send_error(400)
      return
    
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      serv.send_error(401)
      return
    
    if "path" in qs:
      path = qs["path"][0]
    else:
      path = publicid_to_fileid(qs["id"][0])
    
    if path == None:
      serv.send_error(404)
      return
      
    alog("fetching file %s" % path);
    f = File(path, userid)
    
    if f == None:
      serv.send_error(400)
      return
    
    if is_folder(f):
      serv.send_error(401)
      return

    print("diskpath:", f.diskpath)
    try:
      file = open(f.diskpath, "rb")    
    except OSError:
      serv.send_error(404)
      return
    
    body = file.read()
    file.close()
    
    serv.gen_headers("GET", len(body), "application/octet-stream")
    serv.send_header("Content-Disposition", "attachment; filename=\"%s\"" % f.name)
    #Content-Disposition: attachment; filename=FILENAME
    
    serv.wfile.write(body)
