from js_global import *
from js_ast import *
from js_cc import js_parse
from js_process_ast import *
import sys

def module_transform(node, typespace):
  flatten_statementlists(node, typespace)
  
  depends = set()
  
  def at_root(n):
    p = n
    while p != None:
      if isinstance(p, FunctionNode):
        return False
      p = p.parent
    return True
 
  def varvisit(n, startn):
      return
      n2 = js_parse("""
        _es6_module.add_global('$s', $s);
      """, [n.val, n.val])

      insert_after(startn, n2)      
      #startn.parent.insert(startn.parent.index(startn)+1, n2)
      
      for n2 in n[2:]:
        varvisit(n2, startn)
  
  def exportvisit(n):
    if not at_root(n):
      typespace.error("Export statements cannot be within functions or classes", n)
    
    pi = n.parent.index(n)
    n.parent.remove(n)
    
    is_const = False

    if len(n) > 0 and type(n[0]) == VarDeclNode and "const" in n[0].modifiers:
      is_const = True

    if n.name is not None: #can happen with default exports
        for n2 in n[:]:
          n.remove(n2)
          n.parent.insert(pi, n2)
          pi += 1
     
    if not n.is_default:
      if not is_const:
        n2 = js_parse("""
          $s = _es6_module.add_export('$s', $s);
        """, [n.name, n.name, n.name])
      else:
        n2 = js_parse("""
          _es6_module.add_export('$s', $s);
        """, [n.name, n.name, n.name])
      
    else:
      if n.name is not None:
          n2 = js_parse("""
            _es6_module.set_default_export('$s', $s);
          """, [n.name, n.name])
      else:
          n2 = js_parse("""
            _es6_module.set_default_export(undefined, $n);
          """, [n[0]])

    n.parent.insert(pi, n2)

  def get_module_ident(name):
    return name.replace(".", "_").replace("-", "_").replace("/", "_").replace(" ", "")

  def exportfromvisit(n):
    name = get_module_ident(n.name.val)

    if len(n) > 0 and n[0].val == "*":
      n2 = js_parse("""
        import * as _$s1 from '$s2';
        
        for (let k in _$s1) {
          _es6_module.add_export(k, _$s1[k], true);
        }
      """, [name, n.name.val])
    else:
      n2 = StatementList()
      
      depends.add(n.name.val)
      
      for id in n:
        name = id.gen_js(0)
        
        n3 = js_parse("""
        let _ex_$s1 = es6_import_item(_es6_module, '$s2', '$s1');
        
        _es6_module.add_export('$s1', _ex_$s1, true);
        
        """, [name, n.name.val])
        
        n2.add(n3)
    
    n.parent.replace(n, n2)

  #ahem.  if I do this one first, I can use import statements from it.
  #. . .also, how cool, it captures the dependencies, too

  traverse(node, ExportFromNode, exportfromvisit, copy_children=True)
  traverse(node, ExportNode, exportvisit, copy_children=True)
  
  #fetch explicit global variables
  globals = []
  
  def kill_assignments(n):
    n.replace(n[0], ExprNode([]))
    for c in n:
      if type(c) == VarDeclNode:
        kill_assignments(c)
  
  def global_to_var(n):
    if type(n) == VarDeclNode and "global" in n.modifiers:
      n.modifiers.remove("global")
      n.modifiers.add("local")
      
    for c in n:
      global_to_var(c)
      
  def transform_into_assignments(n, parent, pi):
    if type(n) == VarDeclNode and not (type(n[0]) == ExprNode and len(n[0]) == 0):
      n2 = AssignNode(IdentNode(n.val), n[0])
      n.parent.remove(n)
      parent.insert(pi, n2)
      
    for c in n:
      transform_into_assignments(c, parent, pi)
      
  for c in node:
    if type(c) == VarDeclNode and "global" in c.modifiers:
      c2 = c.copy()
      kill_assignments(c2)
      global_to_var(c2)

      globals.append(c2)
      transform_into_assignments(c, c.parent, c.parent.index(c))
      
      
  #to maintain backward compatibility, add everything in module to
  #global namespace (for now).
  
  if glob.g_autoglobalize:
    for n in node[:]:
      if type(n) in [ClassNode, FunctionNode, VarDeclNode, EnumNode]:
        if type(n) == VarDeclNode:
          nname = n.val
        else:
          nname = n.name
          
        n2 = js_parse("""
          $s = _es6_module.add_global('$s', $s);
        """, [nname, nname, nname])
        n.parent.insert(n.parent.index(n)+1, n2)
      elif type(n) == VarDeclNode:
        varvisit(n, n)
    
  def visit(n):
    if not at_root(n):
      typespace.error("Import statements cannot be within functions or classes", n)
      
    modname = n[0].val
    
    depends.add(modname)
    
    if len(n) == 1: #import module name
      n.parent.replace(n, js_parse("""
        es6_import(_es6_module, '$s');
      """, [modname]))
    else:
      slist = StatementList()
      n.parent.replace(n, slist)
      
      for n2 in n[1:]:
        if n2.name == "*":
          n3 = js_parse("""
            var $s = es6_import(_es6_module, '$s');
          """, [n2.bindname, modname])
          
          slist.add(n3)
        elif hasattr(n2, "is_default_binding") and n2.is_default_binding:
          n3 = js_parse("""
          var $s = es6_import_item(_es6_module, '$s', 'default');
          """, [n2.bindname, modname, n2.name])
          
          slist.add(n3)
        else:
          n3 = js_parse("""
          var $s = es6_import_item(_es6_module, '$s', '$s');
          """, [n2.bindname, modname, n2.name])
          
          slist.add(n3)
  
  traverse(node, ImportNode, visit)
  flatten_statementlists(node, typespace)
  
  def class_visit(n):
    if type(n.parent) in [BinOpNode, ExprNode, ExprListNode, AssignNode, VarDeclNode]:
      return
    n2 = js_parse("""
      _es6_module.add_class($s);
    """, [n.name])

    insert_after(n, n2)
    
  traverse(node, ClassNode, class_visit)
  flatten_statementlists(node, typespace)
  
  deps = "["
  for i, d in enumerate(depends):
    if i > 0: 
      deps += ", "
      
    deps += '"'+d+'"'
  deps += "]"
  
  fname = glob.g_file
  if "/" in fname or "\\" in fname:
    fname = os.path.split(fname)[1]
  fname = fname.strip().replace("/", "").replace("\\", "").replace(".js", "")
  
  safe_fname = "_" + fname.replace(" ", "_").replace(".", "_").replace("-", "_") + "_module"
  
  path = os.path.abspath(glob.g_file)
  path = path.replace(os.path.sep, "/")
  
  if ":" in path:
    path = path[path.find(":")+1:]
    
  header = "es6_module_define('"+fname+"', "+deps+", function " + safe_fname + "(_es6_module) {"
  header += "}, '"+path+"');"

  node2 = js_parse(header)
  
  func = node2[0][1][2]
  
  for n in node:
    func.add(n)
    
  node.children = []
  for g in globals:
    node.add(g)
    
  node.add(node2)

  def dynvisit(n):
    if n[0].gen_js(0).strip() == "import":
        n.replace(n[0], IdentNode("_es_dynamic_import"))

        param = IdentNode("_es6_module")
        if type(n[1]) != ExprListNode:
            n2 = ExprListNode([n[1]])
            n.replace(n[1], n2)

        n[1].insert(0, param)


  traverse(node, FuncCallNode, dynvisit)

  
  