import gc, sys
from math import *

table = []

def binomial(n, k):
  global table
  
  if len(table) > n:
    return table[n][k]
    
  if k == 0.0 or k == n:
    return 1
  
  return binomial(n-1, k-1) + binomial(n-1, k);

print("\"use strict\";\nexport var binomial_table = [")

if len(sys.argv) > 1:
  steps = int(sys.argv[1])
else:
  steps = 64;

for i in range(steps):
  arr = []
  
  gc.collect()
  
  sys.stderr.write("doing %i\n" % i);
  
  for j in range(i+1):
    arr.append(binomial(i, j))
  table.append(arr)
  
  add = "," if i != steps-1 else ""
  print("    " + str(arr) + add)

print("];\n")


def bernstein(degree, s):
  degree = max(floor(degree), 0.0)
  
  half = floor(degree/2.0)
  return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);

print("//point at where bernstein basis floor(degree/2), degree is greatest.\n")
print("export var bernstein_offsets = [");

for i in range(steps):
  if i < 3:
    print("    0.5,")
    continue;
  
  #find points closest to zero as well as maxima
  s01 = 0.45 if i > 15 else 0.3;
  s02 = 0.55;
  
  s = 0.5
  df = 0.0000001
  for j in range(254):
    b1 = bernstein(i, s)
    b2 = bernstein(i, s+df)
    b3 = bernstein(i, s+df*2)
    
    d1 = (b2-b1)/df
    d2 = (b3-b2)/df
    d = (d2-d1)/df
    
    if abs(d) < 0.00001: break
    
    #if b1 != 0.0: b1 = 1/b1
    
    s += -(d1/d)*0.5;
    s = min(max(s, 0.0), 1.0)
    
    for k in range(2):
      s2 = s01 if k == 0 else s02
      b1 = bernstein(i, s2)
      b2 = bernstein(i, s2+df)
      d = (b2-b1)/df;
      #8
      if abs(b1) < 0.00001: continue
      if abs(d) == 0.0: continue #< 0.0001: break
      
      fac = -(b1/d)*0.52
      
      sys.stderr.write(" %f %f  |   %f %f\n" % (b1, b2, s01, s02));
          
      if k==0:
        s01 += fac
      else:
        s02 += fac
  
  #print(d1, s)
    
  add = "," if i != steps-1 else ""
  print("    [" + str(s01) + ", " + str(s) + ", " + str(s02) + "]"+add)
  
print("];\n")