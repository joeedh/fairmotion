import os, sys, os.path, math, random, time
import shelve, imp, struct, ply
import mimetypes

mangle_file_paths = False 

#example config_local.py file parameters
serverhost = "127.0.0.1"
serverport = 80

base_path = "/"
serv_unit_tests = True

server_root = "c:/dev/fairmotion/pyserver"
doc_root = "c:/dev/fairmotion"
sp = "/" #os.path.sep
files_root = "c:/dev/fairmotion_user_files_2"

ipaddr = "127.0.0.1"

db_host = "localhost"
db_user = "root"
db_passwd = "SQPass1286OfDoom"
db_db = "fairmotion"

json_mimetype = "application/x-javascript"
