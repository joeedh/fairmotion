"use strict";

var acorn = require("../src/index");

var pp = acorn.Parser.prototype;
var tt = acorn.tokTypes;

pp.isRelational = function (op) {
  return this.type === tt.relational && this.value === op;
};

pp.expectRelational = function (op) {
  if (this.isRelational(op)) {
    this.next();
  } else {
    this.unexpected();
  }
};

pp.argtype_parseDeclareClass = function (node) {
  this.next();
  this.argtype_parseInterfaceish(node, true);
  return this.finishNode(node, "DeclareClass");
};

pp.argtype_parseDeclareFunction = function (node) {
  this.next();

  var id = node.id = this.parseIdent();

  var typeNode = this.startNode();
  var typeContainer = this.startNode();

  if (this.isRelational("<")) {
    typeNode.typeParameters = this.argtype_parseTypeParameterDeclaration();
  } else {
    typeNode.typeParameters = null;
  }

  this.expect(tt.parenL);
  var tmp = this.argtype_parseFunctionTypeParams();
  typeNode.params = tmp.params;
  typeNode.rest = tmp.rest;
  this.expect(tt.parenR);

  this.expect(tt.colon);
  typeNode.returnType = this.argtype_parseType();

  typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
  id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");

  this.finishNode(id, id.type);

  this.semicolon();

  return this.finishNode(node, "DeclareFunction");
};

pp.argtype_parseDeclare = function (node) {
  if (this.type === tt._class) {
    return this.argtype_parseDeclareClass(node);
  } else if (this.type === tt._function) {
    return this.argtype_parseDeclareFunction(node);
  } else if (this.type === tt._var) {
    return this.argtype_parseDeclareVariable(node);
  } else if (this.isContextual("module")) {
    return this.argtype_parseDeclareModule(node);
  } else {
    this.unexpected();
  }
};

pp.argtype_parseDeclareVariable = function (node) {
  this.next();
  node.id = this.argtype_parseTypeAnnotatableIdentifier();
  this.semicolon();
  return this.finishNode(node, "DeclareVariable");
};

pp.argtype_parseDeclareModule = function (node) {
  this.next();

  if (this.type === tt.string) {
    node.id = this.parseExprAtom();
  } else {
    node.id = this.parseIdent();
  }

  var bodyNode = node.body = this.startNode();
  var body = bodyNode.body = [];
  this.expect(tt.braceL);
  while (this.type !== tt.braceR) {
    var node2 = this.startNode();

    // todo: declare check
    this.next();

    body.push(this.argtype_parseDeclare(node2));
  }
  this.expect(tt.braceR);

  this.finishNode(bodyNode, "BlockStatement");
  return this.finishNode(node, "DeclareModule");
};

// Interfaces

pp.argtype_parseInterfaceish = function (node, allowStatic) {
  node.id = this.parseIdent();

  if (this.isRelational("<")) {
    node.typeParameters = this.argtype_parseTypeParameterDeclaration();
  } else {
    node.typeParameters = null;
  }

  node["extends"] = [];

  if (this.eat(tt._extends)) {
    do {
      node["extends"].push(this.argtype_parseInterfaceExtends());
    } while (this.eat(tt.comma));
  }

  node.body = this.argtype_parseObjectType(allowStatic);
};

pp.argtype_parseInterfaceExtends = function () {
  var node = this.startNode();

  node.id = this.parseIdent();
  if (this.isRelational("<")) {
    node.typeParameters = this.argtype_parseTypeParameterInstantiation();
  } else {
    node.typeParameters = null;
  }

  return this.finishNode(node, "InterfaceExtends");
};

pp.argtype_parseInterface = function (node) {
  this.argtype_parseInterfaceish(node, false);
  return this.finishNode(node, "InterfaceDeclaration");
};

// Type aliases

pp.argtype_parseTypeAlias = function (node) {
  node.id = this.parseIdent();

  if (this.isRelational("<")) {
    node.typeParameters = this.argtype_parseTypeParameterDeclaration();
  } else {
    node.typeParameters = null;
  }

  this.expect(tt.eq);

  node.right = this.argtype_parseType();

  this.semicolon();

  return this.finishNode(node, "TypeAlias");
};

// Type annotations

pp.argtype_parseTypeParameterDeclaration = function () {
  var node = this.startNode();
  node.params = [];

  this.expectRelational("<");
  while (!this.isRelational(">")) {
    node.params.push(this.argtype_parseTypeAnnotatableIdentifier());
    if (!this.isRelational(">")) {
      this.expect(tt.comma);
    }
  }
  this.expectRelational(">");

  return this.finishNode(node, "TypeParameterDeclaration");
};

pp.argtype_parseTypeParameterInstantiation = function () {
  var node = this.startNode(),
      oldInType = this.inType;
  node.params = [];

  this.inType = true;

  this.expectRelational("<");
  while (!this.isRelational(">")) {
    node.params.push(this.argtype_parseType());
    if (!this.isRelational(">")) {
      this.expect(tt.comma);
    }
  }
  this.expectRelational(">");

  this.inType = oldInType;

  return this.finishNode(node, "TypeParameterInstantiation");
};

pp.argtype_parseObjectPropertyKey = function () {
  return this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true);
};

pp.argtype_parseObjectTypeIndexer = function (node, isStatic) {
  node["static"] = isStatic;

  this.expect(tt.bracketL);
  node.id = this.argtype_parseObjectPropertyKey();
  this.expect(tt.colon);
  node.key = this.argtype_parseType();
  this.expect(tt.bracketR);
  this.expect(tt.colon);
  node.value = this.argtype_parseType();

  this.argtype_objectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeIndexer");
};

pp.argtype_parseObjectTypeMethodish = function (node) {
  node.params = [];
  node.rest = null;
  node.typeParameters = null;

  if (this.isRelational("<")) {
    node.typeParameters = this.argtype_parseTypeParameterDeclaration();
  }

  this.expect(tt.parenL);
  while (this.type === tt.name) {
    node.params.push(this.argtype_parseFunctionTypeParam());
    if (this.type !== tt.parenR) {
      this.expect(tt.comma);
    }
  }

  if (this.eat(tt.ellipsis)) {
    node.rest = this.argtype_parseFunctionTypeParam();
  }
  this.expect(tt.parenR);
  this.expect(tt.colon);
  node.returnType = this.argtype_parseType();

  return this.finishNode(node, "FunctionTypeAnnotation");
};

pp.argtype_parseObjectTypeMethod = function (start, isStatic, key) {
  var node = this.startNodeAt(start);
  node.value = this.argtype_parseObjectTypeMethodish(this.startNodeAt(start));
  node["static"] = isStatic;
  node.key = key;
  node.optional = false;
  this.argtype_objectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeProperty");
};

pp.argtype_parseObjectTypeCallProperty = function (node, isStatic) {
  var valueNode = this.startNode();
  node["static"] = isStatic;
  node.value = this.argtype_parseObjectTypeMethodish(valueNode);
  this.argtype_objectTypeSemicolon();
  return this.finishNode(node, "ObjectTypeCallProperty");
};

pp.argtype_parseObjectType = function (allowStatic) {
  var nodeStart = this.startNode();
  var node;
  var optional = false;
  var property;
  var propertyKey;
  var propertyTypeAnnotation;
  var token;
  var isStatic;

  nodeStart.callProperties = [];
  nodeStart.properties = [];
  nodeStart.indexers = [];

  this.expect(tt.braceL);

  while (this.type !== tt.braceR) {
    var start = this.markPosition();
    node = this.startNode();
    if (allowStatic && this.isContextual("static")) {
      this.next();
      isStatic = true;
    }

    if (this.type === tt.bracketL) {
      nodeStart.indexers.push(this.argtype_parseObjectTypeIndexer(node, isStatic));
    } else if (this.type === tt.parenL || this.isRelational("<")) {
      nodeStart.callProperties.push(this.argtype_parseObjectTypeCallProperty(node, allowStatic));
    } else {
      if (isStatic && this.type === tt.colon) {
        propertyKey = this.parseIdent();
      } else {
        propertyKey = this.argtype_parseObjectPropertyKey();
      }
      if (this.isRelational("<") || this.type === tt.parenL) {
        // This is a method property
        nodeStart.properties.push(this.argtype_parseObjectTypeMethod(start, isStatic, propertyKey));
      } else {
        if (this.eat(tt.question)) {
          optional = true;
        }
        this.expect(tt.colon);
        node.key = propertyKey;
        node.value = this.argtype_parseType();
        node.optional = optional;
        node["static"] = isStatic;
        this.argtype_objectTypeSemicolon();
        nodeStart.properties.push(this.finishNode(node, "ObjectTypeProperty"));
      }
    }
  }

  this.expect(tt.braceR);

  return this.finishNode(nodeStart, "ObjectTypeAnnotation");
};

pp.argtype_objectTypeSemicolon = function () {
  if (!this.eat(tt.semi) && this.type !== tt.braceR) {
    this.unexpected();
  }
};

pp.argtype_parseGenericType = function (start, id) {
  var node = this.startNodeAt(start);

  node.typeParameters = null;
  node.id = id;

  while (this.eat(tt.dot)) {
    var node2 = this.startNodeAt(start);
    node2.qualification = node.id;
    node2.id = this.parseIdent();
    node.id = this.finishNode(node2, "QualifiedTypeIdentifier");
  }

  if (this.isRelational("<")) {
    node.typeParameters = this.argtype_parseTypeParameterInstantiation();
  }

  return this.finishNode(node, "GenericTypeAnnotation");
};

pp.argtype_parseVoidType = function () {
  var node = this.startNode();
  this.expect(tt._void);
  return this.finishNode(node, "VoidTypeAnnotation");
};

pp.argtype_parseTypeofType = function () {
  var node = this.startNode();
  this.expect(tt._typeof);
  node.argument = this.argtype_parsePrimaryType();
  return this.finishNode(node, "TypeofTypeAnnotation");
};

pp.argtype_parseTupleType = function () {
  var node = this.startNode();
  node.types = [];
  this.expect(tt.bracketL);
  // We allow trailing commas
  while (this.pos < this.input.length && this.type !== tt.bracketR) {
    node.types.push(this.argtype_parseType());
    if (this.type === tt.bracketR) break;
    this.expect(tt.comma);
  }
  this.expect(tt.bracketR);
  return this.finishNode(node, "TupleTypeAnnotation");
};

pp.argtype_parseFunctionTypeParam = function () {
  var optional = false;
  var node = this.startNode();
  node.name = this.parseIdent();
  if (this.eat(tt.question)) {
    optional = true;
  }
  this.expect(tt.colon);
  node.optional = optional;
  node.typeAnnotation = this.argtype_parseType();
  return this.finishNode(node, "FunctionTypeParam");
};

pp.argtype_parseFunctionTypeParams = function () {
  var ret = { params: [], rest: null };
  while (this.type === tt.name) {
    ret.params.push(this.argtype_parseFunctionTypeParam());
    if (this.type !== tt.parenR) {
      this.expect(tt.comma);
    }
  }
  if (this.eat(tt.ellipsis)) {
    ret.rest = this.argtype_parseFunctionTypeParam();
  }
  return ret;
};

pp.argtype_identToTypeAnnotation = function (start, node, id) {
  switch (id.name) {
    case "any":
      return this.finishNode(node, "AnyTypeAnnotation");

    case "bool":
    case "boolean":
      return this.finishNode(node, "BooleanTypeAnnotation");

    case "number":
      return this.finishNode(node, "NumberTypeAnnotation");

    case "string":
      return this.finishNode(node, "StringTypeAnnotation");

    default:
      return this.argtype_parseGenericType(start, id);
  }
};

// The parsing of types roughly parallels the parsing of expressions, and
// primary types are kind of like primary expressions...they're the
// primitives with which other types are constructed.
pp.argtype_parsePrimaryType = function () {
  var typeIdentifier = null;
  var params = null;
  var returnType = null;
  var start = this.markPosition();
  var node = this.startNode();
  var rest = null;
  var tmp;
  var typeParameters;
  var token;
  var type;
  var isGroupedType = false;

  switch (this.type) {
    case tt.name:
      return this.argtype_identToTypeAnnotation(start, node, this.parseIdent());

    case tt.braceL:
      return this.argtype_parseObjectType();

    case tt.bracketL:
      return this.argtype_parseTupleType();

    case tt.relational:
      if (this.value === "<") {
        node.typeParameters = this.argtype_parseTypeParameterDeclaration();
        this.expect(tt.parenL);
        tmp = this.argtype_parseFunctionTypeParams();
        node.params = tmp.params;
        node.rest = tmp.rest;
        this.expect(tt.parenR);

        this.expect(tt.arrow);

        node.returnType = this.argtype_parseType();

        return this.finishNode(node, "FunctionTypeAnnotation");
      }

    case tt.parenL:
      this.next();

      // Check to see if this is actually a grouped type
      if (this.type !== tt.parenR && this.type !== tt.ellipsis) {
        if (this.type === tt.name) {
          var token = this.lookahead().type;
          isGroupedType = token !== tt.question && token !== tt.colon;
        } else {
          isGroupedType = true;
        }
      }

      if (isGroupedType) {
        type = this.argtype_parseType();
        this.expect(tt.parenR);

        // If we see a => next then someone was probably confused about
        // function types, so we can provide a better error message
        if (this.eat(tt.arrow)) {
          this.raise(node, "Unexpected token =>. It looks like " + "you are trying to write a function type, but you ended up " + "writing a grouped type followed by an =>, which is a syntax " + "error. Remember, function type parameters are named so function " + "types look like (name1: type1, name2: type2) => returnType. You " + "probably wrote (type1) => returnType");
        }

        return type;
      }

      tmp = this.argtype_parseFunctionTypeParams();
      node.params = tmp.params;
      node.rest = tmp.rest;

      this.expect(tt.parenR);

      this.expect(tt.arrow);

      node.returnType = this.argtype_parseType();
      node.typeParameters = null;

      return this.finishNode(node, "FunctionTypeAnnotation");

    case tt.string:
      node.value = this.value;
      node.raw = this.input.slice(this.start, this.end);
      this.next();
      return this.finishNode(node, "StringLiteralTypeAnnotation");

    default:
      if (this.type.keyword) {
        switch (this.type.keyword) {
          case "void":
            return this.argtype_parseVoidType();

          case "typeof":
            return this.argtype_parseTypeofType();
        }
      }
  }

  this.unexpected();
};

pp.argtype_parsePostfixType = function () {
  var node = this.startNode();
  var type = node.elementType = this.argtype_parsePrimaryType();
  if (this.type === tt.bracketL) {
    this.expect(tt.bracketL);
    this.expect(tt.bracketR);
    return this.finishNode(node, "ArrayTypeAnnotation");
  }
  return type;
};

pp.argtype_parsePrefixType = function () {
  var node = this.startNode();
  if (this.eat(tt.question)) {
    node.typeAnnotation = this.argtype_parsePrefixType();
    return this.finishNode(node, "NullableTypeAnnotation");
  }
  return this.argtype_parsePostfixType();
};

pp.argtype_parseIntersectionType = function () {
  var node = this.startNode();
  var type = this.argtype_parsePrefixType();
  node.types = [type];
  while (this.eat(tt.bitwiseAND)) {
    node.types.push(this.argtype_parsePrefixType());
  }
  return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
};

pp.argtype_parseUnionType = function () {
  var node = this.startNode();
  var type = this.argtype_parseIntersectionType();
  node.types = [type];
  while (this.eat(tt.bitwiseOR)) {
    node.types.push(this.argtype_parseIntersectionType());
  }
  return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
};

pp.argtype_parseType = function () {
  var oldInType = this.inType;
  this.inType = true;
  var type = this.argtype_parseUnionType();
  this.inType = oldInType;
  return type;
};

pp.argtype_parseTypeAnnotation = function () {
  var node = this.startNode();

  var oldInType = this.inType;
  this.inType = true;
  this.expect(tt.colon);
  node.typeAnnotation = this.argtype_parseType();
  this.inType = oldInType;

  return this.finishNode(node, "TypeAnnotation");
};

pp.argtype_parseTypeAnnotatableIdentifier = function (requireTypeAnnotation, canBeOptionalParam) {
  var node = this.startNode();
  var ident = this.parseIdent();
  var isOptionalParam = false;

  if (canBeOptionalParam && this.eat(tt.question)) {
    this.expect(tt.question);
    isOptionalParam = true;
  }

  if (requireTypeAnnotation || this.type === tt.colon) {
    ident.typeAnnotation = this.argtype_parseTypeAnnotation();
    this.finishNode(ident, ident.type);
  }

  if (isOptionalParam) {
    ident.optional = true;
    this.finishNode(ident, ident.type);
  }

  return ident;
};

acorn.plugins.argument_types = function (instance) {
  // function name(): string {}
  instance.extend("parseFunctionBody", function (inner) {
    return function (node, allowExpression) {
      if (this.type === tt.colon) {
        node.returnType = this.argtype_parseTypeAnnotation();
      }

      return inner.call(this, node, allowExpression);
    };
  });
  
  instance.extend("parseAssignableListItemTypes", function (inner) {
    return function (param) {
      var next = this.lookahead();
      
        //console.log(Object.keys(this.__proto__), Object.keys(this));
      if (this.type != tt.comma && this.value != undefined) {
        //THENODE
        var n = this.startNode();
        
        param.typeAnnotation = this.finishNode(n, "TypeAnnotation"); //{type : "identifier", name : param.name};
        param.name = this.value;
        this.next();
      }
      
      this.finishNode(param, param.type);
      return param;
    };
  });
  
  instance.extend("parseClassSuper", function (inner) {
    return function (node) {
      //node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null;
      if (!this.eat(tt._extends)) {
        node.superClass = null;
        return node;
      }
      node.superClass = this.parseExprSubscripts();
      node.otherSuperClasses = [];
      
      while (this.type == tt.comma) {
        this.next();
        node.otherSuperClasses.push(this.parseExprSubscripts());
      }
      return node;
    }
  });
  
  // var foo: string = bar
  instance.extend("parseStatement", function (inner) {
    return function (decl, topLevel) {
      if (this.type==tt.name && this.value == "static") {
        var starttype = this.type, node = this.startNode();
        //console.log("--------", this.type);
        
        starttype.keyword = "var";
        
        var ret = this.parseVarStatement(node, starttype);
        ret.isStaticLocalVar = true;
        ret.type.isStaticLocalVar = true;
        
        this.finishNode(ret, ret.type);
        return ret;
      }
      
      var ret = inner.call(this, decl, topLevel);
      
      this.finishNode(ret, ret.type);
      return ret;
    };
  });
};