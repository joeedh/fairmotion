from logger import elog, mlog, alog
import time, datetime, random, json
import os, sys, os.path, struct, traceback, gc, io, imp, re
from config import *
from utils import *
import config

if config.use_sqlite:
  import sqlite_db as engine
else:
  import mysql_db  as engine

DBError = engine.DBError
  
import sys
if not WITH_PY2:
  from urllib.parse import urlparse, parse_qs
else:
  from urlparse import urlparse, parse_qs

def get_qs(url):
  return parse_qs(urlparse(url)[4])

if not use_sqlite: #use mysql string escape functions
  import pymysql as mysql
  
  escape_map = {
    str : mysql.converters.escape_unicode,
    int : mysql.converters.escape_int,
    float : mysql.converters.escape_float,
    datetime.datetime : mysql.converters.escape_datetime,
    datetime.timedelta : mysql.converters.escape_timedelta,
    datetime.time : mysql.converters.escape_time,
    bool : mysql.converters.escape_bool,
    dict : mysql.converters.escape_dict
  }
else:
  import sqlite3, datetime
  
  def simple(v): #bad! but okay for sqlite, it's for local servers only
    #print("v->", v)
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'").replace('"', '\\"').replace("`", "\\`") + "'"
  
  def edatetime(v):
    return simple(v)
    
  def etimedelta(v):
    return simple(v)
    
  def etime(v):
    return simple(v)
    
  escape_map = {
    str : simple,
    int : simple,
    float : simple,
    datetime.datetime : edatetime,
    datetime.timedelta : etimedelta,
    datetime.time : etime,
    bool : simple,
    dict : simple
  }
  
def estr(s):
  if type(s) in escape_map:
    func = escape_map[type(s)]
  elif not config.use_sqlite:
    s = str(s)
    func = mysql.converters.escape_string
  else:
    func = simple
    
  return str(func(s))

def mysql_execute(cur, con, estr):
    return engine.sql_execute(cur, con, estr)
  
def mysql_reconnect():
    return engine.sql_reconnect()

def mysql_close_connections():
    return engine.sql_close_connections()
    
def mysql_connect():
    return engine.sql_connect()
    
"int,str[64],time,str[32]"

class SQLType (object):
  def validate(self, data):
    return False;

max_num_len = len(str((1<<32)-1))
class IntType (SQLType):
  maxlen = max_num_len;
  def validate(self, data):
    if len(data.strip()) == 0 or len(data) > max_num_len: return False
    
    try:
      int(data);
    except:
      return False
    return True

class FloatType(SQLType):
  maxlen = max_num_len;
  def validate(self, data):
    if len(data.strip()) == 0 or len(data) > max_num_len: return False
    
    try:
      float(data)
    except:
      return False
    return True

class PathValidate(SQLType):
  maxlen = 150
  def validate(self, data):
    return True; #might as well behave as a string validator, for now. . .

class StrType(SQLType):
  def __init__(self, length):
    SQLType.__init__(self)
    self.len = length;
    self.maxlen = length;
    
  def validate(self, data):
    return len(data) < self.len

def match_re(re, data):
  m = re.match(data)
  if m == None: return False
  
  start, end = m.start(), m.end()
  return start==0 and end == len(data)
  
pass_re = re.compile("{SHA}[a-zA-Z0-9+=\-/]+")
max_pass_length = 128
class PassValidate(SQLType):
  maxlen = max_pass_length
    
  def validate(self, data):
    return match_re(pass_re, data)

user_re = re.compile("[a-zA-Z0-9 _\-+]+")
class UserType(SQLType):
  maxlen = 64
  def validate(self, data):
    return match_re(user_re, data)

col_re = re.compile("[a-zA-Z]+[a-zA-Z_0-9]*")
class ColumnValidate(SQLType):
  maxlen = 12
  def validate(self, data):
    return len(data.strip()) != 0 and match_re(col_re, data)

tokid_re = re.compile(r'[a-zA-Z0-9.]+');
class TokenIDValidate(SQLType):
  maxlen = 64
  def validate(self, data):
    return match_re(tokid_re, data)
 
class DateTimeValidate(SQLType):
  maxlen = 32
  
  def validate(self, data):
    #XXX bad!!
    return "[" not in data and "]" not in data and "(" not in data and ")" not in data

def do_param_error(str):
  alog("possible sql injection: \"" + str + "\"")
  elog("possible sql injection: \"" + str + "\"")
  
class sq:
  passw = PassValidate
  user = UserType
  str = StrType
  int = IntType
  float = FloatType
  col = ColumnValidate
  path = PathValidate
  token = TokenIDValidate
  datetime = DateTimeValidate
  
def do_sql_error(t, d, extra=None):
  elog("Database security failure")
  alog("Database security failure")
  raise SQLParamError("Invalid data for database query: type " + str(t) + ", data: " + estr(d))
  
def param(types, data):
  pass

base_select = "SELECT * FROM WHERE"
colval = ColumnValidate()
max_sql_len = 512 #a nice, conservative, small value

colmap = {
  "user" : sq.user,
  "username" : sq.user,
  "password" : sq.passw,
  "pass" : sq.passw,
  "fileid" : sq.int,
  "userid" : sq.int,
  "tokenid" : sq.token,
  "fileid" : sq.int
}

class SQLParamError (RuntimeError):
  pass

#validates and escapes query parameters
def base_validate(basestr, table, values, types, cols=None):
  maxlen = len(basestr) + len(table) + len("  ")
  
  if len(cols) != len(values):
    raise SQLParamError("Length of cols and values must match in sql_select");
  
  for i, d in enumerate(values):
    d = str(d) #don't use estr at this point; we're just validating
    
    if type(types[i]) == type:
      t = types[i]()
      if type(t) == StrType:
        raise SQLParamError("Invalid SQL validator")
      types[i] = t
    
    if len(d) > types[i].maxlen:
      do_sql_error(types[i], d)
    
    if not types[i].validate(d):
      elog("sql validation error: type " + str(type(types[i])) + ", value: \"" + str(d) + "\"")
      do_sql_error(types[i], d)

    maxlen += types[i].maxlen + 3#''
  
  if cols != None:
    for i, d in enumerate(cols):
      d = d.lower()
      
      if len(d) > colval.maxlen or not colval.validate(d):
        do_sql_error(types[i], d, [table, where])
      maxlen += colval.maxlen + 5 #"''=
    
      if d  in colmap and type(types[i]) != colmap[d]:
        raise SQLParamError(d + " should be type " + str(colmap[d]))
    
  return maxlen
  
def sql_selectall(table, testcols, testvalues, types):
  maxlen = base_validate("SELECT * FROM WHERE", table, testvalues, types, cols=testcols)
  
  qstr = "SELECT * FROM " + table + " WHERE "
  for i, d in enumerate(testvalues):
    if i > 0: qstr += " AND "
    qstr += testcols[i] + "=" + estr(d)
    maxlen += 5
    
  if len(qstr) > maxlen or len(qstr) > max_sql_len:
    raise SQLParamError("max query length exceeded")
  
  return qstr

def sql_insertinto(table, cols, values, types):
  maxlen = base_validate("INSERT INTO VALUES ()", table, values, types, cols=cols)
  
  qstr = "INSERT INTO " + table + " ("
  for i, d in enumerate(cols):
    if i > 0: qstr += ","
    qstr += cols[i]
  qstr += ") VALUES("
  
  for i, d in enumerate(values):
    if i > 0: qstr += ","
    qstr += estr(d)
  qstr += ")"
  
  if len(qstr) > maxlen:
    raise SQLParamError("max query length exceeded")
    
  return qstr

def sql_update(table, cols, values, types, condition_cols, condition_values, condition_types):
  maxlen = base_validate("UPDATE SET ", table, values, types, cols=cols)
  maxlen += base_validate("WHERE ", table, condition_values, condition_types, cols=condition_cols)
  
  qstr = "UPDATE " + table +" SET "
  
  if len(condition_values) != len(condition_types) or len(condition_values) != len(condition_cols):
    raise SQLParamError("mismatching condition cols/values/types length")
    
  for i, d in enumerate(cols):
    if i > 0: qstr += ","
    qstr += d + "=" + estr(values[i])
  
  qstr += " WHERE "
  for i, d in enumerate(condition_cols):
    if i > 0: qstr += ","
    qstr += d + "=" + estr(condition_values[i])
  
  if len(qstr) > maxlen:
    raise SQLParamError("max query length exceeded")
    
  return qstr

def get_last_rowid(cur):
    return engine.get_last_rowid(cur)
    
def valid_pass(p):
  return PassValidate().validate(p)
