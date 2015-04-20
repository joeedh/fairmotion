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

ROOT_PARENT_ID = 1
EMPTY_TAG = "__(empty)__"

#might as well use google's mime type for folders
FOLDER_MIME = "application/vnd.google-apps.folder"
file_restricted_fields = set(["diskpath", "cached_path", "flag"])

def is_folder(file):
  return file["mimeType"] == FOLDER_MIME or ("fileid" in file and file["fileid"] == ROOT_PARENT_ID)

def is_valid_file(file):
  return file["realpath"] != EMPTY_TAG
  
class File (dict):
  #metadata is added automatically from DB keys
  def __init__(self, meta={}):
    for k in meta:
      self[k] = meta[k]

class Folder (File):
  pass

def create_file(userid, filename, mimetype, parentid):
  #fileid "1" is root for active user
  cur, con = mysql_connect()
    
  types  = [sq.int,   sq.int,     sq.str(255), sq.str(100), sq.str(100),   sq.str(255)]
  cols   = ["userid", "parentid", "mimeType", "name",      "other_meta",  "diskpath" ]
  values = [userid,   parentid,   mimetype,   filename,    "" ,           ""         ]
  
  try:
    qstr = sql_insertinto("filedata", cols, values, types)
  except SQLParamError:
    do_param_error("file creation, userid=" + str(userid) + ",  filename="+filename + ", mimetype=" + mimetype, "parentid="+str(parentid))
    raise SQLParamError()
    
  #cur.execute("INSERT INTO filedata (userid,parentid,mimeType,name) VALUES (%d,%d,\"%s\",\"%s\")"%(userid,parentid,mimetype,filename))
  
  cur.execute(qstr);
  con.commit()
  
  return db_engine.get_last_rowid(cur)
  
  cur.execute("SELECT LAST_INSERT_ID()")
  ret = cur.fetchone()
  
  return ret["LAST_INSERT_ID()"]

def fetch_file(fileid):
  cur, con = mysql_connect()
  
  try:
    qstr = sql_selectall("filedata", ["fileid"], [fileid], [sq.int])
  except SQLParamError:
    do_param_error("fetch_file")
    raise SQLParamError()
  
  cur.execute(qstr)
  ret = cur.fetchone()
  
  if ret == None:
    errlog("Warning: invalid fileid %s"%fileid)
    return None
  
  if ret["mimeType"] == FOLDER_MIME:
    f = Folder(ret)
  else:
    f = File(ret)
  
  return f

filetypes = {
  "fileid" : sq.int,
  "parentid" : sq.int,
  "name" : sq.str(512),
  "mimeType" : sq.str(255),
  "other_meta" : sq.str(1024*4),
  "userid" : sq.int,
  "diskpath" : sq.str(512)
}
def update_file(fileid, meta):
  f = fetch_file(fileid)
  
  if f == None:
    errlog("Update for fileid %s failed; invalid id"%fileid)
    return
  
  cur, con = mysql_connect()
  for k in f:
    if k in meta and type(meta[k]) != type(f[k]):
      valid = False
      if type(f[k]) == int:
        try:
          meta[k] = int(meta[k])
          valid = True
        except:
         valid = False;
      if not valid:
        errlog("Invalid metadata")
        return
  
  extra_meta = {}
  for k in meta:
    if k not in f:
      extra_meta[k] = meta[k]
      continue
    elif k != "other_meta": f[k] = meta[k]
  
  if f["other_meta"] != "":
    other_meta = json.loads(f["other_meta"])
  else:
    other_meta = {}
  
  for k in extra_meta:
    other_meta[k] = extra_meta[k]
  
  f["other_meta"] = json.dumps(other_meta)
  
  types = []
  cols = []
  values = []
  
  for i,k in enumerate(f):
    types.append(filetypes[k])
    cols.append(k)
    values.append(f[k])
  
  try:
    qstr = sql_update("filedata", cols, values, types, ["fileid"], [fileid], [sq.int])
  except SQLParamError:
    do_param_error(str(f))
    raise SQLParamError("file update error")
  
  """
  qstr = "UPDATE filedata SET "
  for i,k in enumerate(f):
    val = estr(f[k])
    
    if i > 0: qstr += ","
    qstr += "%s=%s"%(k, val)
    
  qstr += " WHERE fileid=%d"%fileid
  """
  
  cur.execute(qstr)
  con.commit()
  
def fileid_to_publicid(fileid, userid):
  def gen_id(cols, id):
    h = hex(id).replace("0x", "")
    slen = cols-len(h)
    
    for i in range(slen):
      h = "0" + h
    
    h = h.replace("L", "")
    
    return h
    
  return key_rot(gen_id(8, userid) + "." + gen_id(8, fileid));

def publicid_to_fileid(publicid):
  k = key_unrot(publicid)
  if k.count(".") != 1:
    elog("Folder id missing userid component: " + k + "; original: " + publicid)
    elog(key_unrot("2388YXX4240BF6ILF8E9GA6D1"));
    elog(fileid_to_publicid(1, 1));
    elog(key_unrot(fileid_to_publicid(1, 1)));
    
    return None
  
  elog("publicid: " + str(publicid))
  print("\n\nPUBLICID!!\n\n", publicid);
  
  userid, fileid = k.split(".")
  userid = int(userid, 16)
  fileid = int(fileid, 16)
  
  return userid, fileid

def resolve_path(path):
  cs = path.split("/")
  while "" in cs:
    cs.remove("")
  
  if cs == None or len(cs) == 0:
    return ROOT_PARENT_ID
  
  parentid = ROOT_PARENT_ID
  cur, con = mysql_connect()
  
  for i, c in enumerate(cs):
    c = c.strip()
    
    types  = [sq.int,     sq.str(512)]
    cols   = ["parentid", "name"     ]
    values = [parentid,   c          ]
    
    try:
      qstr = sql_selectall("filedata", cols, values, types)
    except SQLParamError:
      do_param_error("resolve_path: \"%s\"" % path)
      raise SQLParamError
    
    cur.execute(qstr);
    ret = cur.fetchone()
    if ret == None:
      return None
    
    parentid = ret["fileid"];
    
  return parentid
  
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
      folderid = publicid_to_fileid(qs["id"][0])
    else:
      folderid = [userid, resolve_path(qs["path"][0])]
    
    if folderid == None or folderid[0] != userid:
      elog("Bad folder " + str(qs["id"][0]) if folderid == None else "Invalid user " + str(userid) + ", " + str(folderid))
      serv.send_error(401)
      return
    
    folderid = folderid[1]
    
    types  = [sq.int  ,  sq.int   ]
    cols   = ["userid", "parentid"]
    values = [userid  , folderid  ]
    
    try:
      qstr = sql_selectall("filedata", cols, values, types)
    except SQLParamError:
      do_param_error("dirlist")
      serv.send_error(400)
      return
    
    """
    qstr = "SELECT name,fileid,mimeType FROM filedata "
    qstr += "WHERE userid="+estr(userid) + " AND "
    qstr += "parentid="+estr(folderid)
    """
    
    cur, con = mysql_connect()
    cur.execute(qstr)
    ret = cur.fetchall()
    
    files = []
    if ret != None:
      for row in ret:
        f = {}
        f["name"] = row["name"]
        f["id"] = fileid_to_publicid(row["fileid"], userid)
        f["mimeType"] = row["mimeType"]
        f["is_dir"] = row["mimeType"] == FOLDER_MIME
        
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
    
    tok = qs["accessToken"][0]
    userid = do_auth(tok)
    
    if userid == None:
      serv.send_error(401)
      return
    
    if "id" in qs:
      folderid = publicid_to_fileid(qs["id"][0])
    else:
      folderid = [userid, resolve_path(qs["path"][0])]
    
    path = None
    if folderid == None:
      serv.send_error(400)
      return
    
    if userid != folderid[0]:
      self.send_error(401)
      
    folderid = folderid[1];
    
    if folderid != 1:
      cols   = ["fileid", "userid"]
      values = [folderid, userid]
      types  = [sq.int  , sq.int]
      
      try:
        qstr = sql_selectall("filedata", cols, values, types)
      except SQLParamError:
        do_param_error("dirnew")
        serv.send_error(400)
        return 
        
      cur, con = mysql_connect()
      cur.execute(qstr)
      ret = cur.fetchone()
      
      if ret == None:
        serv.send_error(400)
        return 
      
      path = "/" + ret["name"]
      
      while ret != None and ret["parentid"] != ROOT_PARENT_ID:
        cols   = ["id"    ]
        values = [ret["parentid"]]
        types  = [sq.int]
        
        try:
          qstr = sql_selectall("filedata", cols, values, types)
        except SQLParamError:
          do_param_error("dirnew")
          serv.send_error(400)
          return 
          
        cur, con = mysql_connect()
        cur.execute(qstr)
        ret = cur.fetchone()
        
        if ret != None:
          path = ret["name"] + "/" + path 
      
      path = path + "/" + qs["name"][0]
    else:
      path = "/" + qs["name"][0]
      
    print("path", path)
    print("folderid", folderid);
    
    #see if folder (or a file) already exists
    if resolve_path(path) != None:
      serv.send_error(400)
      return 
    
    id = create_file(userid, qs["name"][0], FOLDER_MIME, folderid);
    print("FINAL FOLDER ID:", id, folderid);
    
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
    values  = [self.token, self.path,     dnow,        self.fileid]
    
    types  += [sq.str(100), sq.path,       sq.int,      sq.int       ]
    cols   += ["name",      "realpath",    "userid",    "permissions"]
    values += [self.name,   self.realpath, self.userid, 0            ]
    
    types  += [sq.datetime,  sq.int,    sq.int  ]
    cols   += ["expiration", "size",    "cur"   ]
    values += [dend,         self.size, self.cur]
    
    try:
      qstr = sql_insertinto("uploadtokens", cols, values, types)
    except SQLParamError:
      do_param_error(json.dumps(self));
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
    path = files_root + "/" + rot_userid(self.userid)
    path = os.path.abspath(os.path.normpath(path))
    
    replchars = "`'\"\\/^:;()[]{},";
    dirpath = ""
    parentid = self.parentid
    
    while parentid != None and parentid != ROOT_PARENT_ID:
      meta = fetch_file(parentid)
      
      print("PARENTID", parentid, meta["name"]);
      if meta["parentid"] == parentid:
        elog("DATABASE CORRUPTION ERROR; fixing...")
        update_file(parentid, {"parentid" : ROOT_PARENT_ID});
        break
        
      name = ""
      for c in meta["name"]:
        if c in replchars:
          name += "_"
        else:
          name += c
      
      name = name.strip()
      dirpath = meta["name"] + "/" + dirpath
      parentid = meta["parentid"]
    
    dirpath = "/" + dirpath
    print("FINAL DIRPATH", dirpath)
    
    path += dirpath;
    
    if not os.path.exists(path):
      os.makedirs(path)
    
    if mangle_file_paths:
      fname = key_rot(self.name)
    else:
      fname = self.name
    
    path = path + os.sep + fname
    
    path = os.path.abspath(os.path.normpath(path))
    self.realpath = path;
  
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
      serv.send_error(401)
      return
    
    path = qs["path"][0]
    if "id" in qs:
      fileid = qs["id"][0]
    else:
      fileid = resolve_path(path)
    
    if fileid == None:
      elog("creating new file")
      cs = os.path.split(path)
      
      folderid = resolve_path(cs[0])
      if folderid == None:
        elog("invalid folder " + cs[0])
        serv.send_error(401);
        return
      
      if len(cs) == 1 or cs[1] == "":
        fname = cs[0]
      else:
        fname = cs[1]
      
      mime = "application/octet-stream"
      fileid = create_file(userid, fname, mime, folderid)
      meta = fetch_file(fileid);
    else:
      meta = fetch_file(fileid);
    
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
    ustatus.create(utoken, path, userid, fileid, meta["parentid"])
    ustatus.commit()
    
    f = open(ustatus.realpath, "w");
    f.close();
    
    realpath = ustatus.realpath
    cur, con = mysql_connect()
    
    try:
      qstr = sql_update("filedata", ["diskpath"], [realpath], [sq.path], ["fileid"], [fileid], [sq.int])
    except SQLParamError:
      do_param_error("upload start")
      serv.send_error(401)
    
    """
    qstr = "UPDATE filedata SET "
    qstr += "diskpath=%s"%estr(realpath)    
    qstr += " WHERE fileid=%d"%fileid
    #"""
    
    cur.execute(qstr)
    con.commit()
    
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
    
    """
    if not status.file_init:
      status.file = open(status.realpath, "wb")
      csize = 1024*1024*1024
      ilen = math.ceil(max_size/csize);
      
      zerobuf = b""*csize;
     
      for i in range(ilen):
        if i == ilen-1:
          c = b""*(max_size%(csize+1))
        else:
          c = zerobuf;
        
      status.file.write(c)
      status.file.flush()
      status.file.close()
    #"""
    
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
      serv.send_error(404)
      return
      
    alog("fetching file %s" % fileid);
    f = fetch_file(fileid)
    if f == None:
      serv.send_error(400)
      return
    
    if is_folder(f):
      serv.send_error(401)
      return
      
    if f["userid"] != userid:
      serv.send_error(401)
      return
    
    try:
      file = open(f["diskpath"], "rb")    
    except OSError:
      serv.send_error(404)
      return
    
    body = file.read()
    file.close()
    
    serv.gen_headers("GET", len(body), "application/octet-stream")
    serv.send_header("Content-Disposition", "attachment; filename=\"%s\"" % f["name"])
    #Content-Disposition: attachment; filename=FILENAME
    
    serv.wfile.write(body)
