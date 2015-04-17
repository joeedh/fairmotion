import sqlite3, datetime

class DateTimeParseError (RuntimeError):
  pass

#stupid sqlite
datetime_fields = {
  "last_login", "expiration", "expiration", "time"
}

def parse_dt(str):
  i = [0]
  
  def expect(s):
    if not str[i[0]:].startswith(s):
      raise DateTimeParseError("bad1 " + str[i[0]:i[0]+4])
    i[0] += len(s)
    
    return s
  
  def get(n):
    if i[0]+n > len(str):
      raise DateTimeParseError("bad2 " + str[i[0]:i[0]+n])
    ret = str[i[0]:i[0]+n]
    i[0] += n
    
    try:
      ret = int(ret)
    except:
      raise DateTimeParseError("bad3 " + str[i[0]:i[0]+n])
      
    return ret
    
  year = get(4)
  expect("-")
  month = get(2)
  expect("-")
  day = get(2)
  
  if str[i[0]] == " " or str[i[0]] == "\t":
    i[0] += 1
    hour = get(2)
    expect(":")
    minute = get(2)
    expect(":")
    second = str[i[0]:]
    try:
      second = float(second)
    except:
      raise DateTimeParseError("bad4 " + str[i[0]:i[0]+n])
  else:
    hour = 0
    minute = 0
    second = 0
  
  second = int(second+0.5)
  
  return datetime.datetime(year, month, day, hour, minute, second)

def parse_datetime(s):
  try:
    return parse_dt(s)
  except DateTimeParseError:
    print("Parse error!", s)
    return None

sqlite3.register_converter("datetime", parse_datetime)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
        if col[0] in datetime_fields and type(d[col[0]]) == str:
          d[col[0]] = parse_datetime(d[col[0]])
          
    return d
    
DBError = sqlite3.OperationalError

gcon = None
gcur = None

class CurProxy:
    def __init__(self, cur):
      self.cur = cur
      
    def execute(self, str):
      return self.cur.execute(str)
    
    def fetchone(self):
      ret = self.cur.fetchone()
      if ret == None: return None
      return ret
      
def sql_connect():
  global gcon, gcur
  
  if gcon == None:
    gcon = sqlite3.connect("database.db")
    gcon.row_factory = dict_factory
    gcur = gcon.cursor()
    
  return gcur, gcon

def sql_reconnect():
  return sql_connect()

def init_sql():
  pass
  
def default_db():
  cur, con = sql_connect()
  f = open("fairmotion.sql", "r")
  buf = f.read()
  f.close()
  
  statements = [""]
  s = ""
  for l in buf.split("\n"):
    if l.strip().startswith("--") or l.strip().startswith("/*") \
       or l.strip().startswith("//"):
      continue;
    if "ENGINE" in l:
      l = ");"
      
    if l.strip() == "": continue
    if l.startswith("SET"): continue
    
    s += l + "\n"

  for l in s.split("\n"):
    if l.strip() == "": continue
    
    if len(l) > 2 and l[:3] == l[:3].upper() and l[0] not in ["\t", " ", "\n", "\r", "("]:
      statements.append("")
    
    if l.strip().startswith("PRIMARY KEY"): continue
    if l.strip().startswith("KEY"): continue
    
    #l = l.replace("AUTO_INCREMENT", "")
    statements[-1] += l + "\n"
    
    
  for s in statements:
#    buf = s.replace("IF NOT EXISTS ", "")
    print("===executing====")
    print(s)
    con.execute(s)
  
  con.commit()
  
  pass

def get_last_rowid(cur):
  return cur.lastrowid
  