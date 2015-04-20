import os, sys, os.path, math, random, time
import shelve, imp, struct, ply
import mimetypes

#don't store file tree in database, serv file system directly
#serv_simple.py sets this to true
serv_local = False 

#if serv_local is true, will allow access to full filesystem
#serv_simple also sets this to true
serv_all_local = False

#turn filenames into gibberish
mangle_file_paths = False 

#serv_simple.py sets this to true
use_sqlite = False

try:
	WITH_PY2 = True if sys.version_info.major <= 2 else False
except:
	WITH_PY2 = True

def bytes_py2(s, encoding):
  return str(s)

unit_path = "/unit_test.html"
serv_unit_tests = False

#example config_local.py file parameters
#serverhost = "127.0.0.1:8081"
#serverport = 8081
#base_path = "/" #base URL path

content_path = "/content"

#server_root = "/home/joeedh/dev/fairmotion/pyserver"
#doc_root = "/home/joeedh/dev/fairmotion"
#files_root = os.path.abspath(doc_root+".."+os.path.sep+"formacad_user_files"+os.path.sep)

#ipaddr = "127.0.0.1"

#db_host = "localhost"
#db_user = "root"
#db_passwd = ""
#db_db = "fairmotion"

#json_mimetype = "application/x-javascript"

#import local config file

import config_local
mself = sys.modules["config"].__dict__
mlocal = sys.modules["config_local"].__dict__
 
for k in mlocal:
  mself[k] = mlocal[k]

#private globals
client_ip = ""

