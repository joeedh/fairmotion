import shelve, struct, io, imp, ctypes, re
import os, sys, os.path, time, random, math

cache_cache = {}

class CachedDB:
  def __init__(self, db, name=None):
    self.db = db
    
    if name != None:
      if name not in cache_cache:
        cache_cache[name] = {}
      self.cache = cache_cache[name]
    else:
      self.cache = {}
  
  def sync(self):
    self.db.sync()
  
  def close(self):
    self.db.close()
  
  def keys(self):
    return self.db.keys()

  def values(self):
    return self.db.values()
  
  def __iter__(self):
    return self.db.__iter__()
  
  def __getitem__(self, item):
    if item in self.cache:
      return self.cache[item]
    
    ret = self.db[item]
    self.cache[item] = ret
    
    return ret
  
  def __delitem__(self, item):
    del self.db[item]
    if item in self.cache:
      del self.cache[item]
      
  def __setitem__(self, item, val):
    self.db[item] = val
    self.cache[item] = val
  
  def __contains__(self, item):
    return item in self.cache or item in self.db
  
  