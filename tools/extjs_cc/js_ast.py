from js_lex import HexInt, StringLit
from js_global import glob, termColor
from js_util_types import odict
import sys, traceback, os, os.path

def print2(*args):
  s = ""
  for a in args:
    s += str(a) + " "
  sys.stdout.write(s+"\n")
  
if 0: #glob.g_debug_print_calls:
  def theprint(arg, **args):
    args = [arg] + list(args)
    colwid = 80
    
    frame = sys._getframe(1)
    line = frame.f_lineno
    filename = frame.f_code.co_filename
    if "/" in filename or "\\" in filename:
      filename = os.path.split(filename)[1]
    
    filename = "  (%s:%d)" % (filename, line)
    maxcol = colwid - len(filename)-1
    
    out = ""
    for i, a in enumerate(args):
      s = str(a)
      if i > 0: s = " " + s
      out += s
    
    out += "\n"
    out2 = ""
    
    col = 0
    for s in out:
      if s == "\n":
        while col < maxcol:
          col += 1
          out2 += " "
        
        out2 += filename
        col = 0
      
      if col >= maxcol:
        out2 += filename + "\n"
        col = 0
        
      out2 += s
      if s != "\n":
        col += 1
        
    sys.stdout.write(out2)
else:
  theprint = print2

#def print(arg, **args):
#  theprint(arg, **args)
  
def tab(tlvl, tstr="  "):
  s = ""
  for i in range(tlvl):
    s += tstr
  return s

class SourceMap:
  def __init__(self):
    self.lexpos = 0
    
    self.segments = []
  
  def add_segment(self, node, str1):
    if len(str1) == 0: return
    
    self.segments.append([self.lexpos, node, len(str1), str1])
    self.lexpos += len(str1);
  
  def delete_last(self):
    seg = self.segments.pop(-1)
    self.lexpos -= seg[2]
  
  def out(self, node, str1):
    self.add_segment(node, str1)
    return str1

idgen = [1]

class Node (object):
  def __init__(self):
    global idgen 
    
    self._id = idgen[0]
    idgen[0] += 1
    
    self.children = []
    self.parent = None
    self.type = None #node type, don't touch this while parsing
    self.line = glob.g_line
    self.file = glob.g_file
    self.lexpos = glob.g_lexpos
    self.lexpos2 = glob.g_lexpos2
    self.final_type = None
    self.smap = None
    
    if glob.g_comment != None and glob.g_comment != "":
      self.comment = glob.g_comment
      self.commentline = glob.g_comment_line
      glob.g_comment = None
    else:
      self.comment = None
      self.commentline = -1
  
  def c(self):
    if self.comment == None: return ""
    
    if self.comment.strip().startswith("//"):
      self.comment = "/*" + self.comment[self.comment.find("//"):] + "*/"
    return self.comment
    
  #inc is how much to increment self.lexpos
  def s(self, str1):
    if (self.smap != None):
      self.smap.out(self, str1)
    
    return str1
  
  def smap_dellast(self):
    smap = self.smap
      
    if (smap != None):
      smap.delete_last()
  
  def __getitem__(self, item):
    return self.children[item]
    
  def __setitem__(self, item, val):
    self.children[item] = val
    
  def __len__(self):
    return len(self.children)
  
  def index(self, i):
    return self.children.index(i)
    
  def replace(self, oldnode, newnode):
    i = 0
    for c in self.children:
      if c == oldnode:
        break
      i += 1
    
    self.children[i] = newnode
    newnode.parent = self
    
  def _default_node(self, node):
    if type(node) == str:
      if node.startswith('"'):
        node = StrLitNode(node)
      else:
        node = IdentNode(node)
    elif type(node) == float:
        node = NumLitNode(node)
    
    return node
  
  def pop(self, i):
    self.children.pop(i);
    
  def add(self, node):
    node = self._default_node(node)
    
    self.children.append(node)
    node.parent = self
  
  def remove(self, node):
    self.children.remove(node)
    
  def insert(self, i, node):
    node = self._default_node(node)
    self.children.insert(i, node);
    node.parent = self
    
  def prepend(self, node):
    node = self._default_node(node)
    
    self.children.insert(0, node)
    node.parent = self
  
  def extra_str(self):
    return ""
  
  def copy_basic(self, n2):
    n2.type = self.type
    n2.line = self.line
    n2.file = self.file
    n2.lexpos = self.lexpos
    n2.final_type = self.final_type
    
    if hasattr(self, "template"):
      if self.template != None:
        n2.template = self.template.copy()
      
  def copy(self):
    raise RuntimeError(str(glob.g_file) + ": Unimplemented copy function in type %s!"%str(type(self)))
  
  def get_color(self):
    return "orange"

  def copy_children(self, n2):
    n2.children[:] = []
    for c in self:
      n2.add(c.copy())
      
  def gen_js(self, tlevel):
    raise RuntimeError(str(glob.g_file) + ": Unimplemented gen_js function in type %s!"%str(type(self)))
  
  def get_line_str(self):
    name = str(type(self)).replace("js_ast.", "").replace("<class", "").replace(">", "").replace(" ", "").replace("'", "")
    
    c = self.extra_str()
    if len(c.strip()) > 0: c = " " + c
    
    return name + c
   
  def get_ntype_name(self):
    return str(type(self)).replace("js_ast.", "").replace("<class", "").replace(">", "").replace(" ", "").replace("'", "")
    
  def __str__(self, tlevel=0):
    t = tab(tlevel, "-")
    t = termColor(t, "grey")

    name = ""
    if self.type != None:
      if type(self.type) == str:
        name += termColor(self.type, "blue") + " "
      else:
        if hasattr(self.type, "get_type_str"):
          name += termColor(self.type.get_type_str(), "darkblue") + ": "
        else:
          name += "(" + self.type.get_line_str() + "): "
    
    name += termColor(str(type(self)), self.get_color()).replace("js_ast.", "").replace("<class", "").replace(">", "").replace(" ", "").replace("'", "")
    if len(self.children) == 0:
      return t + str(name) + " " + str(self.extra_str())
    else:
      s = t + name + " " + self.extra_str() + termColor(" {\n", self.get_color())
      for c in self.children:
        cs = c.__str__(tlevel+1)
        if not (cs.endswith("\n")):
          cs += "\n"
        
        s += cs
      s += t + termColor("}\n", self.get_color())
      return s
  def __repr__(self):
    return str(self)

class ValueNode (Node):
  val = None

  def __init__(self):
    super(ValueNode, self).__init__()
  
  def gen_js(self, tlevel):
    s = self.s(str(self.val))
    
    return s 
    
  def extra_str(self):
    return str(self.val)

class StrLitNode (ValueNode):
  def __init__(self, str):
    super(StrLitNode, self).__init__()
    self.val = str
  
  def gen_js(self, tlevel):
    s = self.s(self.val)
    
    return s;
  
  def copy(self):
    n2 = StrLitNode(str(self.val))
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2
    
class RegExprNode (StrLitNode):
  def copy(self):
    n2 = RegExprNode(str(self.val))
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2

class NumLitNode (ValueNode):
  def __init__(self, num):
    super(NumLitNode, self).__init__()
    self.val = num
  
  def get_type_str(self):
    return "float" if type(self.val) == float else "int"
  
  def fmt(self):
    if type(self.val) == HexInt:
      return hex(self.val)
    elif type(self.val) in [int, float]:
      return str(self.val)
  
  def gen_js(self, tlevel):
    if type(self.val) == HexInt:
      s = hex(self.val)
    elif type(self.val) == int:
      s = str(self.val)
    elif type(self.val) == float:
      s = str(self.val)
    
    s = self.s(s)

    return s
    
  def copy(self):
    n2 = NumLitNode(self.val)
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2

class CommentNode (Node):
  def __init__(self, comment=""):
    super(CommentNode, self).__init__()
    self.comment = comment
  
  def copy(self):
    return CommentNode(self.comment)
  
  def gen_js(self, tlevel=0):
    t1 = tab(tlevel)
    t2 = tab(tlevel+1)
    
    if not "\n" in self.comment:
      return "/*" + self.comment + "*/"
    else:
      ls = [l.replace("\r" ,"") for l in self.comment.split("\n")]
      
      s = "/*\n"
      
      for l in ls:
        s += t2 + l + "\n"
      s += t1 + "*/\n"
      
      return s
    
class IdentNode (ValueNode):
  def __init__(self, ident, local=False):
    super(IdentNode, self).__init__()

    if type(ident) == IdentNode:
      ident = ident.val
      
    self.val = ident
    self.local = local

    self.lexpos2 = self.lexpos + len(ident)
  
  def get_color(self):
    return "teal"

  def gen_js(self, tlevel):
    s = self.s(str(self.val))
    
    return s
  
  def get_type_str(self):
    return self.val
    
  def extra_str(self):
    return str(self.val) + " " + str(self.local)    
  
  def __setval__(self):
    return self.val
  
  def get_type_name(self):
    return self.val
  
  def copy(self):
    n2 = IdentNode(str(self.val))
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2

class VarDeclNode(IdentNode):
  def get_color(self):
    return "yellow"

  def __init__(self, expr=None, local=False, name="(unnamed)"):
    #self[0] is assignment expression
    #self[1] is type
    #self[2..] are chained var decl child nodes

    if expr is None:
        expr = ExprNode()

    super(VarDeclNode, self).__init__(expr)

    if type(name) == IdentNode:
      name = name.val
    
    self.spread = False
    self.modifiers = set()
    self.val = name
    self.suppress_modifiers = False
    
    if local:
        self.modifiers.add("local")

    self.type = None
    self.add(expr)
    
    #make sure to add type to self, please;
    #it should be self[1]
  
  def get_type_str(self):
    def get_type(n, visit=None):
      if visit == None: visit = set()
      
      if n in visit:
        return n.get_line_str()
      visit.add(n)
      
      if type(n) == str:
        return n
      elif n.type == str:
        if n.type in [VarDeclNode, IdentNode]:
          return n.val
        else:
          return "(corruption)"
      elif type(n) == IdentNode:
        return n.val
      elif type(n) == VarDeclNode:
        return n.get_type_str()
      elif type(n) == TemplateNode:
        return n.get_type_str()
      elif isinstance(n, TypeNode):
        return get_type(n.type, visit)
      elif type(n) == TypedClassNode:
        return n.name
      elif type(n) == TypeRefNode:
        return get_type(n.type)
      elif type(n) == TypedClassRef:
        return n.type
      else:
        return self.val
      
    if self.type == self:
      return self.val
    return get_type(self[1])
    
  def gen_js(self, tlevel):
    if type(self.modifiers) != set:
       sys.stderr.write("WARNING: corrupted modifiers in VarDeclNode.  Regenerating.\n")
       self.modifiers = set()
       print(self)
       
    if self.local: self.modifiers.add("local")
    elif "local" in self.modifiers:
      self.local = True
    
    if "global" in self.modifiers:
      return ""
    
    s = ""

    if not self.suppress_modifiers:
      if "let" in self.modifiers and type(self.parent) != VarDeclNode: 
        s += "let "
      elif "const" in self.modifiers and type(self.parent) != VarDeclNode: 
        s += "const "
      elif self.local and type(self.parent) != VarDeclNode: 
        s += "var "
      elif "static" in self.modifiers and type(self.parent) != VarDeclNode: 
        s += "static "
        
    if self.spread:
        s += '...'
    s += str(self.val)
    
    s = self.s(s)

    if glob.g_include_types and self.type != None and type(self.type) != UnknownTypeNode:
        s += " : " + self.type.get_type_str()
 
    if len(self.children) > 0 and len(self.children[0].gen_js(tlevel).strip()) > 0:
      s += self.s("=") + self.children[0].gen_js(tlevel)
    
    if len(self.children) > 2:
      for c in self.children[2:]:
        s += self.s(", ") + c.gen_js(tlevel)
        pass
    
    return s
  
  def copy(self):
    n2 = VarDeclNode(ExprNode([]), name=str(self.val))
    n2.local = self.local
    n2.modifiers = set(self.modifiers)
    
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2
    
  def extra_str(self):
    return self.val + " " + str(self.local)
  
  def __setval__(self):
    return self.get_type_str()
  
class TypeNode(Node):
  def __init__(self, type):
    super(TypeNode, self).__init__()
    self.type = type
  
  def gen_js(self, tlevel):
    return ""
  
  def get_type_name(self):
    if type(self.type) == str: return self.type
    else: return self.type.get_type_name()
    
  def __setval__(self):
    s = str(type(self))
    return s[s.find("<"):s.find(">")]

class StaticArrNode(Node):
  def __init__(self, name_node, size):
    """
    layout: self[0] is array name node
            self[1] is array type
            parent should be a var decl node
    """
    Node.__init__(self)
    
    self.size = size
    self.add(name_node)
  
  def extra_str(self):
    return str(self.size)
    
  def copy(self):
    n = StaticArrNode(Node(), self.size)
    
    n.remove(n[0])
    
    self.copy_basic(n)
    self.copy_children(n)
    
    return n
    
  def get_type_str(self):
    t = self[0]
    if type(t) != str: t = t.get_type_str()
    
    return "%s[%i]" % (t, self.size)
  
  def get_type_name(self):
    return self.get_type_str()
    
class FuncRefNode(TypeNode):
  def __init__(self, name):
    super(FuncRefNode, self).__init__(UndefinedTypeNode())
    self.template = None
    self.name = name
  
  def copy(self):
    n2 = FuncRefNode(str(self.name))
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

  def get_type_str(self):
    s = self.type.get_type_str() + " "
    s += self.name
    
    if self.template != None:
      s += self.template.extra_str()
    s += "("
    
    for i, c in enumerate(self[0]):
      if i > 0: s += ", "
      
      if isinstance(c, TypeNode):
        s += c.get_type_str()
      else:
        s += c.gen_js(0)
      
    s += ")"
    return s
  
  def __setval__(self):
    return self.get_type_str(self)
    
  def gen_js(self, tlevel):
    s = ""
    
    return s
    
  def extra_str(self):
    return self.get_type_str()
    s = self.name

      
    s +=  self.children[0].extra_str()
    return s

class BuiltinTypeNode(TypeNode):
  def __init__(self, tname):
    super(BuiltinTypeNode, self).__init__(tname)
  
  def copy(self):
    n2 = BuiltinTypeNode(str(self.type) if type(self.type) == str else self.type.copy())
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def compatible(self, b):
    infertypes = ["float", "int", "byte", "short", "char"]
    
    return (self.type == b.type) or (self.type in infertypes and b.type in infertypes)
    
  def get_type_str(self):
    if type(self.type) == str: return self.type
    elif self.type == None: return "{type-corruption}"
    else: return self.type.extra_str()
  
  def extra_str(self):
    return str(self.type)
  
  def __setval__(self):
    return "BuiltinTypeNode(%s)" % self.get_type_str()
    
#this node encapsulates code with an unknown type    
class UnknownTypeNode(TypeNode):
  def __init__(self, node=None):
    super(UnknownTypeNode, self).__init__(self)
    if node != None:
      self.add(node)
  
  def copy(self):
    n2 = UnknownTypeNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def get_type_name(self):
    return "(UnknownNode)"
    
  def gen_js(self, tlevel):
    s = ""
    for c in self.children:
      s += c.gen_js(tlevel)
    return s
  
  def get_type_str(self):
    return "(UnknownTypeNode)"
    
class VoidTypeNode(TypeNode):
  def __init__(self, node=None):
    super(VoidTypeNode, self).__init__(self)
    if node != None:
      self.add(node)
  
  def copy(self):
    n2 = VoidTypeNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def get_type_name(self):
    return "void"
    
  def gen_js(self, tlevel):
    s = ""
    for c in self.children:
      s += c.gen_js(tlevel)
    return s
  
  def get_type_str(self):
    return "void"

class TemplateStandInType(VoidTypeNode):
  def get_type_name(self):
    return "TemplateStandIn"
    
  def copy(self):
    n2 = TemplateStandInType()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
  
class UndefinedTypeNode(TypeNode):
  def __init__(self, node=None):
    super(UndefinedTypeNode, self).__init__(self)
    if node != None:
      self.add(node)
      
  def copy(self):
    n2 = UndefinedTypeNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2  
    
  def get_type_name(self):
    return "None"
    
  def gen_js(self, tlevel):
    s = ""
    for c in self.children:
      s += c.gen_js(tlevel)
    return s
  
  def get_type_str(self):
    return "None"
    
class TypeRefNode (TypeNode):
  def __init__(self, typeref):
    if type(typeref) == IdentNode:
      typeref = typeref.val
      
    TypeNode.__init__(self, typeref)

    self.template = None
  
  def copy(self):
    n2 = TypeRefNode(self.type)
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def extra_str(self):
    s = str(self.type)
    if self.template != None:
      s += " " + self.template.extra_str()
    return s
  
  def gen_js(self, tlevel):
    s = ""
    if type(self.type) == str:
      s += self.s(self.type)
    else:
      s += self.type.gen_js(tlevel)
    
    return s
  
  def get_type_str(self):
    return self.__setval__()
    
  def __setval__(self):
    s = ""
    
    if type(self.type) == str:
      s += self.type
    else:
      s += self.type.get_type_str()
      
    if self.template != None:
      s += "<%s>" % self.template.__setval__()
      
    return s

class EnumNode(Node):
    def __init__(self, name="anonymous"):
        Node.__init__(self)
        self.name = name

    def gen_js(self, tlevel=0):
        ts = tab(tlevel-1)
        ts2 = tab(tlevel)

        if glob.g_include_types:
            s = self.s("enum ")
            s += self.s(self.name) + "{\n"
            for i, c in enumerate(self):
                s += ts2 + c.gen_js(tlevel)
                if i < len(self)-1:
                    s += ","
                s += "\n"
            s += ts + "}\n\n"

            return s
        else:
            s = self.s("const ")
            s += self.s(self.name) + " = {\n"
            for i, c in enumerate(self):
                s += ts2 + c[0].gen_js(tlevel) + " : " + c[1].gen_js(tlevel)
                if i < len(self)-1:
                    s += ","
                s += "\n"
            s += ts + "};\n\n"

            return s

        return ""

class NullStatement(Node):
  def __init__(self):
    super(NullStatement, self).__init__()
  
  def copy(self):
    n2 = NullStatement()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    p = self.parent
    
    if type(p) not in [WhileNode, ForLoopNode, IfNode, ElseNode]:
      return ""
    else:
      return self.s(";")

class DeleteNode (Node):
  def __init__(self, expr):
    super(DeleteNode, self).__init__()
    self.add(expr)
  
  def copy(self):
    n2 = DeleteNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    s = self.s("delete ")
    
    s += self.children[0].gen_js(tlevel)
    return s;
    
def node_eq(a, b):
  if type(a) != type(b): return False
  
  stack1 = [a]
  stack2 = [a]
  
  while len(stack1) > 0 and len(stack2) > 0:
    n1 = stack1.pop(-1)
    n2 = stack2.pop(-1)
    
    if type(n1) != type(n2):
      return False
    if not n1.node_eq(n2):
      return False    
      
    for c in n1.children:
      stack1.append(c)
    for c in n2.children:
      stack2.append(c)
      
  if len(stack1) != len(stack2):
    return False
  
  return True

class TemplateNode(Node):
  def __init__(self, exprlist):
    super(TemplateNode, self).__init__()
    self.add(exprlist)
    self.type = None
    self.name_expr = None #used in later stages of type processing
  
  def copy(self):
    n2 = TemplateNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)

    if self.name_expr != None:
      n2.name_expr = str(self.name_expr) if type(self.name_expr) == str else self.name_expr.copy()
    
    return n2
    
  def get_type_str(self):
    s = ""
    if self.name_expr != None:
      s += self.name_expr.gen_js(0)

    s += "<"
    for i, c in enumerate(self[0]):
      if i > 0: s += ", "
      if hasattr(c, "get_type_str"): #type(c) in [VarDeclNode, TemplateNode]:
        s += c.get_type_str()
      else:
        s += c.gen_js(0)
    s += ">"
    return s
  
  def extra_str(self, print_self=False):
    s = ""
    if print_self:
      s += str(self)
    
    if self.name_expr != None:
      s += self.name_expr.gen_js(0)
      
    s += "<<"
    for i, c in enumerate(self[0]):
      if i > 0:
        s += ", "
      if type(c) in [VarDeclNode, BuiltinTypeNode, TemplateNode]:
        s += c.get_type_str()
      else:
        s2 = c.gen_js(0);
        if s2 == "":
          s2 = c.extra_str()
        s += s2
    s += ">>"
    return s
  
  def gen_js(self, tlevel):
    if len(self) > 1:
      return self.children[1].gen_js(tlevel)
  
  def __setval__(self):
    return self.get_type_str()
  
  def get_type_name(self):
    return self[1].get_type_name()
    
class BinOpNode (Node):
  def __init__(self, a, b, op):
    super(BinOpNode, self).__init__()
    self.op = op
    self.add(a);
    self.add(b);
  
  def copy(self):
    n2 = BinOpNode(self[0], self[1], self.op)
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    if self.op in ["instanceof", "in"]:
      s = self.children[0].gen_js(tlevel)
      s += self.s(" "+self.op+" ") + self.children[1].gen_js(tlevel)
      return s
    else:
      s = self.children[0].gen_js(tlevel)
      s += self.s(self.op) + self.children[1].gen_js(tlevel)
      return s
      
  def extra_str(self):
    return str(self.op)

class ExprNode (Node):
  def __init__(self, exprnodes=None, add_parens=False):
    if exprnodes is None:
        exprnodes = []

    super(ExprNode, self).__init__()
    self.add_parens = add_parens
    
    for e in exprnodes:
      self.add(e)
  
  def get_color(self):
    return "blue"

  def copy(self):
    n2 = ExprNode(self)
    self.copy_basic(n2)
    self.copy_children(n2)
    
    n2.add_parens = self.add_parens
    
    return n2
      
  def gen_js(self, tlevel):
    s = ""
    if self.add_parens: 
      s += self.s("(")
    
    for i, c in enumerate(self.children):
      if i != 0:
        s += self.s(", ")
      
      c1 = c.gen_js(tlevel)
      if c1 == None:
        print("problem in ExprNode.gen_js()", type(c))
        continue
        
      s += c1
    
    if self.add_parens: 
      s += self.s(")")
      
    return s
    
class ArrayRefNode (Node):
  def __init__(self, var, ref):
    super(ArrayRefNode, self).__init__()
    self.add(var)
    self.add(ref)
  
  def copy(self):
    n2 = ArrayRefNode(self[0], self[1])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    return self[0].gen_js(tlevel) + self.s("[") + self[1].gen_js(tlevel) + self.s("]")
    
class ArrayLitNode (Node):
  def __init__(self, exprlist):
    super(ArrayLitNode, self).__init__()
    self.add(exprlist)
  
  def copy(self):
    n2 = ArrayLitNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

  def get_type_str(self):
    if type(self.type) == str:
      return self.type
    elif self.type != None:
      return self.type.get_type_str()
    else: return ""
    
  def gen_js(self, tlevel):
    s = self.s("[")

    s += self.children[0].gen_js(tlevel);
    
    s += self.s("]")
    return s

class RuntimeObjectKey (Node):
  def __init__(self, expr):
    super(RuntimeObjectKey, self).__init__()
    self.add(expr)
  
  def gen_js(self, tlevel):
    return "[" + self[0].gen_js(tlevel) + "]"

class ObjLitNode (Node):
  def __init__(self):
    self.name = "anonymous"
    self.is_prototype = False
    super(ObjLitNode, self).__init__()
    
  def copy(self):
    n2 = ObjLitNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    s = self.s("{")
    
    tab = ""
    for i in range(tlevel):
      tab += " "

    for i, c in enumerate(self):
      if i > 0: 
        s += self.s(", \n" + tab + " ")
      
      if type(c) == ObjLitSetGet or type(c) == BindingArg:
        s += c.gen_js(tlevel+1)
      else:
        s += c[0].gen_js(tlevel+1) + self.s(": ") + c[1].gen_js(tlevel+1)
      
    s += self.s("}")
    return s

#objlitnode whose gen_js formats in Require.JS class prototype style
class RJSObjLitNode (ObjLitNode):
  def gen_js(self, tlevel):
    t1 = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s = "{\n"
    for i, c in enumerate(self):
      s += t2
      s += c[0].gen_js(tlevel)
      s += " : " + c[1].gen_js(tlevel+1)
      
      if i != len(self)-1:
        s += ","
      s += "\n\n"
      
    s += t1 + "}"
    return s
    
#duplicate of ExprNode, but with different type to (hopefully) avoid chain confusion
class ExprListNode (ExprNode):
  def __init__(self, exprnodes=None):
    if exprnodes is None:
        exprnodes = []

    super(ExprListNode, self).__init__(exprnodes)
    
  def get_type_str(self):
    return self.gen_js(0)
  
  def get_color(self):
    return "peach"

  def copy(self):
    n2 = ExprListNode(self)
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def flatten(self):
    pass
 
class ExpandNode (ExprListNode):
  def __init__(self, nodes=None):
    ExprListNode.__init__(self, [] if nodes is None else nodes)
    
    self.modifiers = set()
    self.etype = "array"
  
  def gen_js(self, tlevel=0):
    s = ""
    
    for m in self.modifiers:
      s += self.s(m.lower() + " " )
      
    s += self.s("/*unprocessed ExpandNode*/")
                
    if self.etype == "array":
      s += self.s("[")
    else:
      s += self.s("{")
    
    for i in range(len(self)):
      if i > 0:
        s += self.s(", ")
      
      s += self[i].gen_js(tlevel)
      
    if self.etype == "array":
      s += self.s("]")
    else:
      s += self.s("}")
    
    return s
  
class MemberRefNode (Node):
  def __init__(self, parent, member):
    super(MemberRefNode, self).__init__()
    
    self.add(parent)
    self.add(member)
    
  def copy(self):
    n2 = MemberRefNode(self[0], self[1])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class VarRefNode (Node):
  def __init__(self, var):
    super(VarRefNode, self).__init__()
    self.add(var)

  def copy(self):
    n2 = VarRefNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class PositiveNode(Node):
  def __init__(self, expr):
    super(PositiveNode, self).__init__()
    self.add(expr)   
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    return self.s("+") + self.children[0].gen_js(tlevel);

  def copy(self):
    n2 = PositiveNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class NegateNode(Node):
  def __init__(self, expr):
    super(NegateNode, self).__init__()
    self.add(expr)   
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    return self.s("-") + self.children[0].gen_js(tlevel);

  def copy(self):
    n2 = NegateNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class TypeofNode(Node):
  def __init__(self, expr):
    super(TypeofNode, self).__init__()
    self.add(expr)   
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    s = self.s("typeof ")
    
    return s + self.children[0].gen_js(tlevel)
    
  def copy(self):
    n2 = TypeofNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2   
    
class LogicalNotNode(Node):
  def __init__(self, expr):
    super(LogicalNotNode, self).__init__()
    self.add(expr)   
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    return self.s("!") + self.children[0].gen_js(tlevel)

  def copy(self):
    n2 = LogicalNotNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class BitInvNode(Node):
  def __init__(self, expr):
    super(BitInvNode, self).__init__()
    self.add(expr)   
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    return self.s("~") + self.children[0].gen_js(tlevel)
    
  def copy(self):
    n2 = BitInvNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class AssignNode (Node):
  def __init__(self, var_ref, expr, flags=set(), mode="="):
    super(AssignNode, self).__init__()
    
    self.mode = mode
    self.add(var_ref)
    self.add(expr)
    self.type = None
    self.flags = set(flags) #duplicate
  
  def gen_js(self, tlevel):
    s = self.children[0].gen_js(tlevel)
    
    sm = self.s(" "+self.mode+" ")
    s = s + sm + self.children[1].gen_js(tlevel)
    
    return s
    
  def extra_str(self):
    s = ""
    if self.type != None:
      s += self.type.extra_str() + " "
    s += self.mode
    return s

  def copy(self):
    n2 = AssignNode(self[0], self[1])
    n2.mode = self.mode
    n2.flags = set(self.flags)
    
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

def legacy_endstatem(c, c2):
  ret = len(c2.strip()) > 0 and not c2.strip().endswith(";")
  ret2 = not c2.strip().endswith("}") or type(c) in [ExprListNode, VarDeclNode, AssignNode, ExprNode, BinOpNode]

  return ret and ret2
  
class StatementList (Node):
  def __init__(self):
    super(StatementList, self).__init__()
    self.force_block = False
  
  def get_color(self):
    return "green"

  def gen_js(self, tlevel):
    t = tab(tlevel)
    t2 = tab(tlevel+1)
    s = ""
    
    if self.force_block:
        s += self.s("{")
        pass
        
    for c in self.children:
      if type(c) == StatementList:
        c2 = c.gen_js(tlevel);
      else:
        self.s(t)
      
        c2 = c.gen_js(tlevel+1)
          
        #if tlevel == -1: continue
        if 0: #XXX len(c2.strip()) == 0: 
          if self.smap != None:
            self.smap.lexpos -= len(c2)+len(t)
            while self.smap.segments[-1][0] >= self.smap.lexpos:
              self.smap.segments.pop(-1)
          continue
        
        if legacy_endstatem(c, c2):
          c2 += self.s(";")
          
        c2 = t + c2

      if not c2.endswith("\n"): 
          c2 += self.s("\n")
      
      s += c2
      
    if self.force_block:
        s += self.s("}")
        pass
    return s
  
  def copy(self):
    n2 = StatementList()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    n2.force_block = self.force_block
    
    return n2
    
class FuncCallNode (Node):
  def __init__(self, name_expr):
    super(FuncCallNode, self).__init__()
    self.template = None
    self.add(name_expr)
  
  def gen_js(self, tlevel):
    s = self.children[0].gen_js(tlevel) + self.s("(")
    
    if len(self.children) > 1:
      s += self.children[1].gen_js(tlevel)
      
      """
      for i, c in enumerate(self.children[1].children):
        if i > 0: s += ", "
        
        s += c.gen_js(tlevel)
      """
    s += self.s(")")
    
    return s
    
  def extra_str(self):
    s = ""
    if self.template != None:
      s += self.template.extra_str() + " "
      
    s +=  self.children[0].extra_str()
    return s
  
  def copy(self):
    n2 = FuncCallNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class InitCallNode (FuncCallNode):
  def __init__(self, name_expr):
    super(InitCallNode, self).__init__(name_expr)

  def copy(self):
    n2 = InitCallNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2

class TypedClassRef (Node):
  def __init__(self, cls):
    Node.__init__(self)
    
    self.type = cls
    
class FunctionNode (StatementList):
  """
  children:
  
  0   : parameters
  1-X : function statements
  
  """
  def copy(self):
    n2 = FunctionNode(self.name, self.lineno)
    self.copy_basic(n2)
    self.copy_children(n2)
    
    n2.members = odict()
    n2.functions = odict()
    n2.class_type = self.class_type
    n2.is_generator = self.is_generator
    n2.class_parent = self.class_parent
    n2.path = self.path
    n2.ret = self.ret
    n2.is_native = self.is_native
    n2.is_anonymous = self.is_anonymous
    n2.is_arrow = self.is_arrow
    n2.add_function_keyword = self.add_function_keyword
    
    return n2
    
  #NEED TO GET RID OF THIS LINENO PARAMETER!
  #(and member; both have been replaced by node.line/node.lexpos)
  def __init__(self, name, lineno=0):
    super(FunctionNode, self).__init__()
    
    self.add_function_keyword = True

    self.name = name
    self.origname = name
    self.keyword = None

    self.is_anonymous = False
    self.is_arrow = False
    self.is_native = False
    
    self.members = odict()
    self.functions = odict() #this is local nested functions, not class members
    self.ret = None
    self.class_type = "func" #valid values: ["func", "method", "class", "array"]
    self.type = None
    self.is_generator = False
    self.args = odict()
    self.arg_is = odict()
    self.path = None
    self.class_parent = None
    self.child_classes = odict()
    self.is_builtin = False
    self.logrecs = []
    self.template = None
    
    self.lrec_args = odict()
    
    if type(lineno) != int:
      self.lineno = lineno(1)
    else:
      self.lineno = lineno
  
  def add_class_child(self, child):
    if type(child) != FunctionNode:
      raise JSError("Invalid argument for FunctionNode.add_class_child")
    
    child.class_parent = self
    self.child_classes[child.name] = child
    
  def get_type_str(self):
    s = self.name
    if self.type != None:
      s += self.type.get_type_str()
    return s
    
  def get_args(self):
    args = []
    for c in self[0]:
      args.append(c.val)
    
    self.args = args
    return args
  
  def get_path(self):
    if self.path == None: return self.name
    else: return self.path
    
  def set_arg(self, arg, node):
    self[0][self.arg_is[arg]] = node
    node.parent = self[0]
    
    self.args[arg] = node

  def gen_js_arrow(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
        
    
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s = self.s("(")
    
    for i, c in enumerate(self.children[0].children):
      if i > 0: 
        s += self.s(", ")
      
      s += c.gen_js(tlevel)

    s += self.s(")")
    if glob.g_include_types and self.type != None and type(self.type) != UnknownTypeNode:
        s += " : " + self.type.get_type_str()
    s += self.s(" => ")

    add_block = len(self.children[1:]) < 2
    if len(self.children) > 1:
        rn = self.children[1];
        if isinstance(rn, ReturnNode):
            rn = rn[0]

        while isinstance(rn, StatementList):
            add_block = add_block or len(rn) > 1
            if len(rn) > 0:
                rn = rn[0]
            else:
                break

        add_block = add_block or type(rn) in [IfNode, WhileNode, SwitchNode, ForCNode, ThrowNode]
        add_block = add_block or type(rn) in [ForInNode, ForLoopNode, TryNode, ObjLitNode, DoWhileNode]

    #XXX logic here doesn't always works, sometimes produces garbage results
    add_block = True

    if add_block:
        s += self.s(t + " {" + ("\n" if len(self.children) > 1 else ""))
    else:
        t2 = ""
        
    for c in self.children[1:]:
      if not add_block and type(c) == ReturnNode:
        c = c[0]
        
      if type(c) != StatementList:
        cd = self.s(t2) + c.gen_js(tlevel+1 if add_block else 0)
      else:
        cd = c.gen_js(tlevel)

      if not add_block:
          while cd.endswith("\n") or cd.endswith(" ") or cd.endswith("\t") or cd.endswith(";"):
            cd = cd[:-1]

      #XXX if len(cd.strip()) == 0: continue
      
      if add_block and len(cd.strip()) > 0 and not cd.strip().endswith("}") and not cd.strip().endswith(";"):
        cd += self.s(";")
        
      if add_block and not cd.endswith("\n"):
        cd += self.s("\n")
      s += cd
      
    if add_block:
        s += self.s(t+"}")
    
    return s
    
  def gen_js(self, tlevel):
    if self.is_native: return ""

    if self.is_arrow:
        return self.gen_js_arrow(tlevel)
      
    t = tab(tlevel-1)
    t2 = tab(tlevel)

    s = self.s("")

    if self.keyword is not None:
        s += self.s(self.keyword + " ")

    s += "function" if self.add_function_keyword else ""

    if not glob.g_expand_generators and self.is_generator:
      s += "* "
    else:
      s += " "

    name = self.name
    if isinstance(name, Node):
        name = name.gen_js(0).strip()

    if name != "" and name != "(anonymous)":
      s += "%s("%name
    else:
      s += "("
    
    s = self.s(s)
    
    for i, c in enumerate(self.children[0].children):
      if i > 0: 
        s += self.s(", ")
      
      s += c.gen_js(tlevel)
      #if c.type != None:
      #  s += " : " + c.type.get_type_str()
      
    s += self.s(")")
    if self.type != None and glob.g_include_types and type(self.type) != UnknownTypeNode:
        s += self.s(" : " + str(self.type.get_type_str()))

    s += self.s(" {\n")

    for c in self.children[1:]:
      if type(c) != StatementList:
        cd = self.s(t2) + c.gen_js(tlevel+1)
      else:
        cd = c.gen_js(tlevel)
      
      #XXX if len(cd.strip()) == 0: continue
      
      if len(cd.strip()) > 0 and not cd.strip().endswith("}") and not cd.strip().endswith(";"):
        cd += self.s(";")
        
      if not cd.endswith("\n"): 
        cd += self.s("\n")
      s += cd
      
    s += self.s(t+"}")
    
    return s
   
  def extra_str(self):
    s = ""
    
    if self.is_generator:
      s += "* "
    
    if self.type != None:
      if type(self.type) == str:
        s += self.type + " "
      else:
        s += self.type.get_type_str() + " "
    
    if isinstance(self.name, NumLitNode):
        s += str(self.name.val)
    elif isinstance(self.name, Node):
        s += self.name.extra_str()
    else:
        s += self.name
    
    if self.type != None:
      s += self.type.extra_str()
    return s
  
class SwitchNode(Node):
  def __init__(self, expr):
    super(SwitchNode, self).__init__()
    self.add(expr)   
  
  def copy(self):
    n2 = SwitchNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    cs = self.children
    s = self.s("switch (")
    
    s += cs[0].gen_js(tlevel) 
    sadd = ") {\n"
    s += self.s(sadd)
    
    for c in cs[1:]:
      self.s(t2)
      s += t2 + c.gen_js(tlevel+1)
      
    s += self.s(t + "}")
    
    return s
    
class CaseNode(Node):
  def __init__(self, expr):
    super(CaseNode, self).__init__()

    if expr != "default":
      self.add(expr)   
  
  def copy(self):
    n2 = CaseNode(self[0] if len(self) > 0 else "default")
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    cs = self.children
    
    s = self.s("case ")    
    s += cs[0].gen_js(tlevel)
    
    s += self.s(":\n") + cs[1].gen_js(tlevel)

    return s
    
class DefaultCaseNode(CaseNode):
  def __init__(self):
    super(DefaultCaseNode, self).__init__("default")
  
  def copy(self):
    n2 = DefaultCaseNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    cs = self.children
    s = self.s("default:\n")
    
    s += cs[0].gen_js(tlevel)
    
    return s
    
class WithNode(Node):
  def __init__(self, expr):
    super(WithNode, self).__init__()
    self.add(expr)   
  
  def copy(self):
    n2 = WithNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s1 = self.s("with (")
    
    s = s1 + self.children[0].gen_js(tlevel)
    
    s += self.s(")")
    
    if type(self.children[1]) != StatementList:
      sadd = self.s("\n" + t2)
      s += add
      
      s += self.children[1].gen_js(tlevel) + self.s(";");
    else:
      s += self.s(" {\n") 
      s += self.children[1].gen_js(tlevel+1) 
      
      s += self.s(t + "}")
      
    return s
    
  def extra_str(self):
    return ""

class IfNode(Node):
  def __init__(self, expr):
    super(IfNode, self).__init__()
    self.add(expr)   
  
  def copy(self):
    n2 = IfNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s1 = self.s("if (")
    s = s1 + self.children[0].gen_js(tlevel)
    
    if type(self.children[1]) == ObjLitNode: #the grammers do mix a bit
      sadd = self.s(") {\n" + t + "}")
      s += sadd
    elif type(self.children[1]) != StatementList:
      sadd = self.s(")\n" + t2)
      sadd += self.children[1].gen_js(tlevel) #+ self.s(";");
      
      s += sadd
    else:
      sadd = self.s(") {\n")
      
      sadd += self.children[1].gen_js(tlevel+1) + self.s(t + "}")
      
      s += sadd
      
    if len(self) > 2:
      for c in self.children[2:]:
        s += c.gen_js(tlevel)
    
    return s
  def extra_str(self):
    return ""

class TryNode(Node):
  def __init__(self):
    super(TryNode, self).__init__()
  
  def copy(self):
    n2 = TryNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    s = self.s("try ")
    
    #if len(self.children) == 0:
    #  c1 = s + self.s("{\n" + t + "}\n")
    
    if type(self.children[0]) != StatementList:
      c1 = s + self.s("{\n") + "%s%s" % (t2, self.children[0].gen_js(tlevel))
      c1 += self.s("}")
    else:
      c1 = s + self.s("{\n") 
      c1 += self.children[0].gen_js(tlevel) + self.s(t) + self.s("}")
      
    if len(self.children) > 1:
      c2 = "\n"
      for c in self.children[1:]:
        c2 += self.s(t) + c.gen_js(tlevel)
    else:
      c2 = ""
    
    return c1 + c2
    
  def extra_str(self):
    return ""

class CatchNode(Node):
  def __init__(self, expr):
    super(CatchNode, self).__init__()
    self.add(expr)
    
  def copy(self):
    n2 = CatchNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2 
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s = self.s("catch (") + self.children[0].gen_js(tlevel) + self.s(") ")
    if type(self.children[1]) != StatementList:
      s += self.s("\n" + t2) + self.children[1].gen_js(tlevel) + self.s(";");
    else:
      s += self.s("{\n") + self.children[1].gen_js(tlevel+1) + self.s(t+"}")
    
    return s
    
class WhileNode(Node):
  def __init__(self, expr):
    super(WhileNode, self).__init__()
    self.add(expr)   
    self.label = None
    
  def extra_str(self):
    return ""
    
  def copy(self):
    n2 = WhileNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.label = self.label
    
    return n2 
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    if len(self.children) == 0:
      return self.s("malformed while {\n")
    
    s = ""
    if self.label is not None:
      s += self.label + ": "
      
    s += self.s("while (") + self.children[0].gen_js(tlevel) + self.s(") {\n")
    
    if len(self.children) == 1:
      c = self.s("malformed while\n")
    else:
      if type(self.children[1]) != StatementList:
        c = self.s(t2)
      else:
        c = ""
        
      c += self.children[1].gen_js(tlevel)
      
      """
      if c != "{}":
        if type(self.children[1]) != StatementList:
          c = t2 + c + "\n"
      else:
        c = ""
      """
      
    s += c + self.s(t+"}\n")
    return s

class ForCNode(Node):
  def __init__(self, s1, s2, s3):
    super(ForCNode, self).__init__()
    self.add(s1)
    self.add(s2)
    self.add(s3)
    
  def copy(self):
    n2 = ForCNode(self[0], self[1], self[2])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    cs = self.children
    c1 = cs[0].gen_js(tlevel)
    
    s = c1 + self.s("; ") + cs[1].gen_js(tlevel)
    s += self.s("; ") + cs[2].gen_js(tlevel)
    return s
  
class ForInNode(Node):
  def __init__(self, var, list):
    self.of_keyword = "in"
    
    super(ForInNode, self).__init__()
    self.add(var)
    self.add(list)
    
  def copy(self):
    n2 = ForInNode(self[0], self[1])
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.of_keyword = self.of_keyword
    
    return n2
    
  def gen_js(self, tlevel):
    s = self.children[0].gen_js(tlevel) + self.s(" "+self.of_keyword+" ") 
    s += self.children[1].gen_js(tlevel)
    
    return s
    
  def extra_str(self):
    return ""

def endline(node, s):
  if not s.endswith("\n"):
    s += node.s("\n")
  return s
  
class ForLoopNode(Node):
  """
    self[0] : loop expression
    self[1] : statementlist
  """
  
  def __init__(self, expr):
    super(ForLoopNode, self).__init__()
    self.add(expr) 
    self.label = None
  
  def copy(self):
    n2 = ForLoopNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.label = self.label
    
    return n2
    
  def extra_str(self):
    return self.label+":" if self.label is not None else ""
  
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s = "";
    
    if self.label is not None:
      s += self.s(self.label + ": ")
      
    s += self.s("for (") + self.children[0].gen_js(tlevel) + self.s(") {\n")
    
    c = endline(self, self.children[1].gen_js(tlevel+1))

    s += c
    s += self.s(t+"}")
    
    return s
    
class DoWhileNode(Node):
  def __init__(self, expr):
    super(DoWhileNode, self).__init__()
    self.add(expr)   
    self.label = None
    
  def copy(self):
    n2 = DoWhileNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.label = self.label
    
    return n2
    
  def extra_str(self):
    return ""
    
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    
    s = ""
    if self.label is not None:
      s += self.s(self.label + ": ")
      
    s += self.s("do {\n")    
    
    if type(self[1]) != StatementList:
      s += self.s(t2);
      
    c = self[1].gen_js(tlevel)
    if type(self[1]) != StatementList:
      c += self.s("\n")
      
    s += c + self.s(t + "} while (") + self[0].gen_js(tlevel) + self.s(")")
    return s

class ElseNode(Node):
  def __init__(self, c=None):
    super(ElseNode, self).__init__()
    
    if c != None:
      self.add(c)
  
  def copy(self):
    n2 = ElseNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    t = tab(tlevel-1)
    t2 = tab(tlevel)
    s = self.s("else ")
    
    if len(self.children) == 0:
      return s + self.s("{\n%s}\n" % t)
    if type(self.children[0]) == ObjLitNode: #the grammars do mix a bit
      return s + self.s(" {\n" + t + "}")
    elif type(self.children[0]) != StatementList:
      return s + self.s("\n"+t2) + self.children[0].gen_js(tlevel)
    else:
      return s + self.s("{\n") + self.children[0].gen_js(tlevel) + self.s(t + "}\n")
      
class TrinaryCondNode(Node):
  def __init__(self, s1, s2, s3):
    super(TrinaryCondNode, self).__init__()
    self.add(s1)
    self.add(s2)
    self.add(s3)
  
  def copy(self):
    n2 = TrinaryCondNode(self[0], self[1], self[2])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    cs = self.children
    
    return cs[0].gen_js(tlevel) + self.s(" ? ") + cs[1].gen_js(tlevel) + self.s(" : ") + cs[2].gen_js(tlevel)

class KeywordNew(Node):
  def __init__(self, expr):
    super(KeywordNew, self).__init__()
    self.add(expr)
  
  def copy(self):
    n2 = KeywordNew(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    return self.s("new ") + self[0].gen_js(tlevel)
    
  def extra_str(self):
    return ""

class YieldNode (Node):
  def __init__(self, expr):
    super(YieldNode, self).__init__()
    self.add(expr)
    self.print_return = False
  
  def copy(self):
    n2 = YieldNode(self[0])
    n2.print_return = self.print_return
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    if self.print_return:
      return self.s("return ") + self.children[0].gen_js(tlevel)
    else:
      return self.s("yield ") + self.children[0].gen_js(tlevel)

class ReturnNode(Node):
  def __init__(self, expr):
    super(ReturnNode, self).__init__()
    self.add(expr)
  
  def copy(self):
    n2 = ReturnNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def extra_str(self):
    return ""
  
  def gen_js(self, tlevel):
    return self.s("return ") + self.children[0].gen_js(tlevel)
    
class ThrowNode(Node):
  def __init__(self, expr):
    super(ThrowNode, self).__init__()
    self.add(expr)
  
  def copy(self):
    n2 = ThrowNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
  def gen_js(self, tlevel):
    return self.s("throw ") + self.children[0].gen_js(tlevel);
    
  def extra_str(self):
    return ""
    
class IncDec(Node):
  def __init__(self, expr):
    super(IncDec, self).__init__()
    self.add(expr)
  
  def extra_str(self):
    return ""
  
  def copy(self):
    n2 = IncDec(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class PreInc(IncDec):
  def gen_js(self, tlevel):
    return self.s("++") + self.children[0].gen_js(tlevel)
  
  def copy(self):
    n2 = PreInc(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class PostInc(IncDec):
  def gen_js(self, tlevel):
    return self.children[0].gen_js(tlevel) + self.s("++")
  
  def copy(self):
    n2 = PostInc(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class PreDec(IncDec):
  def gen_js(self, tlevel):
    return self.s("--") + self.children[0].gen_js(tlevel)
    
  def copy(self):
    n2 = PreDec(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class PostDec(IncDec):
  def gen_js(self, tlevel):
    return self.children[0].gen_js(tlevel) + self.s("--")
    
  def copy(self):
    n2 = PostDec(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
class ContinueNode (Node):
  def __init__(self):
    Node.__init__(self)
    self.label = None
    
  def gen_js(self, tlevel):
    s = self.s("continue")
    
    if self.label is not None:
      s += self.s(" " + self.label)

    return s
    
  def copy(self):
    n2 = ContinueNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.label = self.label
    
    return n2
    
class BreakNode (Node):
  def __init__(self):
    Node.__init__(self)
    self.label = None
    
  def gen_js(self, tlevel):
    s = self.s("break")
    
    if self.label is not None:
      s += self.s(" " + self.label)

    return s
    
  def copy(self):
    n2 = BreakNode()
    self.copy_basic(n2)
    self.copy_children(n2)
    n2.label = self.label
    
    return n2

class ClassMember (IdentNode):
  def __init__(self, name):
    IdentNode.__init__(self, name)
    self.modifiers = set()
    self.type = None;
    
  def gen_js(self, tlevel):
    s = ""
    for m in self.modifiers:
      s += self.s(m + " ")
    s += self.s(self.val)
    
    if len(self) > 0:
      s += self.s(" = ") + self[0].gen_js(0)
    return s


class MethodNode(FunctionNode):
  def __init__(self, name, is_static=False):
    FunctionNode.__init__(self, name, glob.g_line)

    self.is_static = is_static
    self.is_generator = False
    self.add_function_keyword = False

    if self.is_static:
        self.keyword = "static"

    #self[0] : params
    #self[1] : statementlist

  def gen_js(self, tlevel=0):
    if self.is_static:
        self.keyword = "static"

    return super(MethodNode, self).gen_js(tlevel)

  def _old_gen_js(self, tlevel):
    s = ""

    if self.is_generator:
        s += self.s("* ")

    if self.is_static:
      s += "static "
    
    name = self.name
    if type(name) != str:
      name = name.gen_js(tlevel)
    
    s += self.s(name + "(")
    
    for i, c in enumerate(self[0]):
      if i > 0: s += c.s(", ")
      s += c.gen_js(0)
    s += ")"

    if self.type != None and glob.g_include_types and type(self.type) != UnknownTypeNode:
        s += " : " + str(self.type.get_type_str())

    s += " {\n"
    s += self[1].gen_js(tlevel)
    s += self.s(tab(tlevel-1) + "}")
    
    return s

class ObjLitSetGet(Node):
  def __init__(self, key=None, val=None, getsetkey=None):
    Node.__init__(self)
    
    val.add_function_keyword = False
    self.getsetkey = getsetkey

    if key is not None and val is not None:
      self.add(key)
      self.add(val)
  
  def copy(self):
    n2 = ObjLitSetGet(getsetkey=self.key)
    
    self.copy_basic(n2)
    self.copy_children(n2)
    return n2

  def gen_js(self, tlevel=0):
    s = ""

    s += self.s(self.getsetkey + " ")
    
    s += self[1].gen_js(tlevel).strip()

    return s

class ClassPropNode(Node):
    def __init__(self, name, type1=None, value=None):
        Node.__init__(self)

        if type(type1) == ExprNode:
            type1 = type1.type

        self.modifiers = set()
        self.type = IdentNode(type1) if type(type1) == str else type1

        if value:
            self.add(value)
        self.name = name

    def get_type_str(self):
        if self.type is not None:
            return self.type.get_type_str()
        else:
            return "(none)"

    def gen_js(self, tlevel=0):
        if not glob.g_emit_class_vars:
            return self.s("")
        if glob.g_prune_unassigned_class_vars and len(self) == 0:
          return self.s("")
          
        s = self.s("")
        for m in self.modifiers:
            s += self.s(m + " ")

        s += self.s(self.name)
        
        if self.type is not None and glob.g_include_types:
            s += self.s(" : ")
            if type(self.type) == VarDeclNode:
                s += self.type.get_type_str()
            else:
                s += self.type.gen_js(0)
            pass

        if len(self) > 0:
            s += self.s(" = ") + self[0].gen_js(0)
        elif not glob.g_include_types or self.type is None:
          #Create a valid ES declaration
          s += self.s(" = undefined")
          
        s += self.s(";")
        
        return s

class MethodGetter(MethodNode):
  def __init__(self, name, is_static=False):
    MethodNode.__init__(self, name, is_static)
    #getters do not take any function parameters,
    #but since we ultimately inherit
    #from FunctionNode we add an empty param list
    #here.
    self.add(ExprListNode([]))
    self.keyword = "get"
    
  def _old_gen_js(self, tlevel):
    s = self.s("get " + str(self.name) + "(")
    
    for i, c in enumerate(self[0]):
      if i > 0: s += c.s(", ")
      s += c.gen_js(0)
    s += ") {\n"
    
    s += self[1].gen_js(tlevel)
    s += self.s(tab(tlevel-1) + "}")
    
    return s

class MethodSetter(MethodNode):
  def __init__(self, name, is_static=False):
    MethodNode.__init__(self, name, is_static)
    self.keyword = "set"

  def _old_gen_js(self, tlevel):
    s = self.s("set " + str(self.name) + "(")
    
    for i, c in enumerate(self[0]):
      if i > 0: s += c.s(", ")
      s += c.gen_js(0)
    s += ") {\n"
    
    s += self[1].gen_js(tlevel)
    s += self.s(tab(tlevel-1) + "}")
    
    return s
    
class ClassNode(Node):
  def __init__(self, name, parents):
    Node.__init__(self)
  
    self.name = name
    self.parents = parents
    
  def gen_js(self, tlevel):
    t0 = tab(tlevel-1)
    t1 = tab(tlevel)
    t2 = tab(tlevel+1)
    
    s = self.s("class " + self.name)
    if glob.g_include_types and self.type is not None and type(self.type) != UnknownTypeNode:
        s += self.s(self.type.get_type_str())
    s += self.s(" ")

    if self.parents != None and len(self.parents) > 0:
      s += self.s("extends ")
      for i, p in enumerate(self.parents):
        if i > 0: s += self.s(", ")
        s += p.gen_js(0)
    s += self.s(" {\n")

    for c in self:
      s += t1 + c.gen_js(tlevel+1) + "\n"
    s += t0 + "}"
    
    return s

class TypedClassNode(Node):
  def __init__(self, name, parent=None):
    Node.__init__(self)
    
    self.name = name
    self.cls_parent = parent  
    self.getters = {}
    self.setters = {}
    self.methods = {}
    self.props = {}
    self.childmap = {}
    
    self.size = None
    
  def start(self, typespace):
    """
    propegate self.getters/setters/methods/props
    """
    for c in self.children:
      if type(c) == VarDeclNode:
        if c.val in self.props:
          typespace.error("duplicate property " + c.val, c)
        self.props[c.val] = c
        self.childmap[c.val] = c
      elif type(c) == MethodNode:
        if c.name in self.methods:
          typespace.error("duplicate method " + c.name, c)
        self.methods[c.name] = c
        self.childmap[c.name] = c
      elif type(c) == MethodGetter:
        if c.name in self.getters:
          typespace.error("duplicate getter " + c.name, c)
        self.getters[c.name] = c
        self.childmap[c.name] = c
      elif type(c) == MethodSetter:
        if c.name in self.setters:
          typespace.error("duplicate setter " + c.name, c)
        self.setters[c.name] = c
        self.childmap[c.name] = c
      
    g = self.getters; s = self.setters; m = self.methods; p = self.props
    for k in g:
      if k in m or k in p:
        typespace.error(k + " is already defined", g[k])
    
    for k in s:
      if k in m or k in p:
        typespace.error(k + " is already defined", s[k])
        
    for k in m:
      if k in g or k in s or k in p:
        typespace.error(k + " is already defined", m[k])
    
    for k in p:
      if k in s or k in m or k in g:
        typespace.error(k + " is already defined", p[k])
        
  def extra_str(self):
    if self.cls_parent != None:
      return ("%s extends %s" % (self.name, self.cls_parent))
    else:
      return self.name
      
  def gen_js(self, tlevel):
    return ""

class FinallyNode (Node):
  def __init__(self):
    Node.__init__(self)
    
  def copy(self):
    n2 = FinallyNode(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2 
  
  def gen_js(self, tlevel):
    s = self.s("finally {\n")
    s += self[0].gen_js(tlevel+1)
    s += tab(tlevel) + "}\n"
    
    return s

class BindingIdent (IdentNode):
  def __init__(self, val):
    IdentNode.__init__(self, val)
    self.is_default_binding = False
    self.name = val
    self.bindname = val
    
class ExportNode(Node):
  def __init__(self, name, is_default=False): #first child is whats exported
    Node.__init__(self)
    self.name = name
    self.bindname = name
    self.is_default = is_default
  
  def extra_str(self):
    if self.bindname != self.name:
      return str(self.name) + " as " + self.bindname
    return str(self.name)
  
  #just pass through
  def gen_js(self, tlevel=0):
    ret = self.s("export ")
    for c in self.children:
      ret += c.gen_js(tlevel)
    return ret

#use for comment system
class NewlineNode(Node):
  def __init__(self):
    Node.__init__(self)
  def gen_js(self, tlevel=0):
    return "\n"
    
class ExportNameNode(Node):
  def __init__(self): #children is list of ExportIdents
    Node.__init__(self)
    
class ExportFromNode(Node):
    def __init__(self, modname): #children are ExportIdent's of what to export
        Node.__init__(self)
        self.name = modname

    def gen_js(self, tlevel=0):
        if glob.g_es6_modules and not glob.g_inside_js_parse:
            #this can happen if type logger is enabled,
            #node doesn't really survive
            #raise RuntimeError("this node shouldn't have survived")
            pass

        t = tab(tlevel)
        s = self.s("")
        s += self.s("export")

        if len(self) == 1 and self[0].gen_js(0).strip() == "*":
            s += self.s(" * ")
        else:
            s += self.s("{")

            for i, c in enumerate(self):
                if i > 0:
                    s += self.s(",")
                s += c.gen_js(0)
            s += self.s("}")

        s += self.s(" from ")
        s += self.s(str(self.name))

        return s

class ExportIdent(IdentNode):
  def __init__(self, name, binding=None):
    if binding == None: binding = name
    IdentNode.__init__(self, name)

    self.bindname = binding
    
class BindingArg(IdentNode):
  def __init__(self, id):
    IdentNode.__init__(self, id, True)
    self.val = id
  
  def gen_js(self, tlevel=0):
    s = self.s("...")
    if type(self.val) == str:
      s += self.s(self.val)
    else:
      s += self.val.gen_js(tlevel)
    return s
    
class ImportNode(Node):
  '''
  first node is always from clause
  '''
  
  def __init__(self):
    Node.__init__(self)
    self.add(StrLitNode(""))
  
  def gen_js(self, tlevel):
    s = self.s("import ")
    
    if len(self) == 2 and self[1].name == "*":
      s += self[1].gen_js(tlevel)
    else:
      s += self.s("{")
      
      for i, c in enumerate(self[1:]):
        if i > 0:
          s += self.s(", ");
        s += c.gen_js(tlevel)
      s += self.s("}")
     
    s += self.s(" from '")
    s += self[0].gen_js(0) + "'"
    
    #s += str(self.parent)
    
    return s
    
class ImportDeclNode(Node):
  def __init__(self, name, bindname=None):
    Node.__init__(self);
    
    self.import_all = False
    
    if bindname != None:
      self.bindname = bindname
    else:
      self.bindname = name
    
    self.name = name
    
  def extra_str(self):
    return str(self.name) + " as " + str(self.bindname)
    
  def gen_js(self, tlevel):
    if self.bindname == self.name:
      s = self.s(self.name)
    else:
      s = self.s(self.name + " as " + self.bindname)
    
    return s 
    
  def copy(self):
    n2 = PreDec(self[0])
    self.copy_basic(n2)
    self.copy_children(n2)
    
    return n2
    
def node_is_class(node):
  if type(node) != FunctionNode:
    return False
  return node.class_type in ["class", "array"]

def func_is_class(node):
  if type(node) != FunctionNode:
    return False
  return node.class_type in ["class", "array"]

def line_print(s, do_print=True):
  lines = s.split("\n")
  s2 = ""
  for i, l in enumerate(lines):
    s2 += "%d %s\n" % (i+1, l)
  
  if do_print:
    print(s2)
  return s2

