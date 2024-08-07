"use strict";

var ast_util = require("./ast_util"),
    js_parse = ast_util.js_parse;
/*
  implement extjs's class transformation, so things work mid-refactor
*/

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.ClassDeclaration = ClassDeclaration;
exports.ClassExpression = ClassExpression;
exports.__esModule = true;

var prefix = "babel-core/lib/babel/transformation/";
var prefix2 = "babel-core/node_modules/";

var ReplaceSupers = _interopRequire(require(prefix+"helpers/replace-supers"));

var nameMethod = _interopRequireWildcard(require(prefix+"helpers/name-method"));

var defineMap = _interopRequireWildcard(require(prefix+"helpers/define-map"));

var messages = _interopRequireWildcard(require(prefix+"../messages"));

var util = _interopRequireWildcard(require(prefix+"../util"));

var traverse = _interopRequire(require(prefix+"../traversal"));

var each = _interopRequire(require(prefix2+"lodash/collection/each"));

var has = _interopRequire(require(prefix2+"lodash/object/has"));

var t = _interopRequireWildcard(require(prefix+"../types"));

var PROPERTY_COLLISION_METHOD_NAME = "__initializeProperties";

var check = t.isClass;

exports.check = check;

function ClassDeclaration(node, parent, scope, file) {
  return t.variableDeclaration("let", [t.variableDeclarator(node.id, t.toExpression(node))]);
}

function ClassExpression(node, parent, scope, file) {
  return new ClassTransformer(this, file).run();
}

var collectPropertyReferencesVisitor = {
  Identifier: {
    enter: function enter(node, parent, scope, state) {
      if (this.parentPath.isClassProperty({ key: node })) {
        return;
      }

      if (this.isReferenced() && scope.getBinding(node.name) === state.scope.getBinding(node.name)) {
        state.references[node.name] = true;
      }
    }
  }
};

var verifyConstructorVisitor = traverse.explode({
  MethodDefinition: {
    enter: function enter() {
      this.skip();
    }
  },

  Property: {
    enter: function enter(node) {
      if (node.method) this.skip();
    }
  },

  CallExpression: {
    enter: function enter(node, parent, scope, state) {
      if (this.get("callee").isSuper()) {
        state.hasBareSuper = true;
        state.bareSuper = this;

        if (!state.hasSuper) {
          throw this.errorWithNode("super call is only allowed in derived constructor");
        }
      }
    }
  },

  FunctionDeclaration: {
    enter: function enter() {
      this.skip();
    }
  },

  FunctionExpression: {
    enter: function enter() {
      this.skip();
    }
  },

  ThisExpression: {
    enter: function enter(node, parent, scope, state) {
      //allow this before super
      //if (state.hasSuper && !state.hasBareSuper) {
      //  throw this.errorWithNode("'this' is not allowed before super()");
      //}

      if (state.isNativeSuper) {
        return state.nativeSuperRef;
      }
    }
  }
});

var ClassTransformer = (function () {

  /**
   * Description
   */

  function ClassTransformer(path, file) {
    _classCallCheck(this, ClassTransformer);

    this.parent = path.parent;
    this.scope = path.scope;
    this.node = path.node;
    this.path = path;
    this.file = file;

    this.hasInstanceDescriptors = false;
    this.hasStaticDescriptors = false;

    this.instanceMutatorMap = {};
    this.staticMutatorMap = {};

    this.instancePropBody = [];
    this.instancePropRefs = {};
    this.staticPropBody = [];
    this.body = [];

    this.hasConstructor = false;
    this.hasDecorators = false;
    this.className = this.node.id;
    this.classRef = this.node.id || this.scope.generateUidIdentifier("class");

    this.superName = this.node.superClass || t.identifier("Function");
    this.hasSuper = !!this.node.superClass;

    this.isLoose = file.isLoose("es6.classes");
  }

  /**
   * Description
   *
   * @returns {Array}
   */

  ClassTransformer.prototype.run = function run() {
    var superName = this.superName;
    var className = this.className;
    var classBody = this.node.body.body;
    var classRef = this.classRef;
    var file = this.file;

    //

    var superClass = this.node.superClass;
    this.isNativeSuper = superClass && t.isIdentifier(superClass) && t.NATIVE_TYPE_NAMES.indexOf(superClass.name) >= 0;

    if (this.isNativeSuper) {
      this.nativeSuperRef = this.scope.generateUidIdentifier("this");
    }

    //

    var body = this.body;

    //

    var constructorBody = this.constructorBody = t.blockStatement([]);
    var constructor;

    if (this.className) {
      constructor = t.functionDeclaration(this.className, [], constructorBody);
      body.push(constructor);
    } else {
      constructor = t.functionExpression(null, [], constructorBody);
    }

    this.constructor = constructor;

    //

    var closureParams = [];
    var closureArgs = [];

    //
    if (this.hasSuper) {
      var array = js_parse("[]", {start_node : "ArrayExpression"});
      
      var supers = [superName];
      var mixins = this.node.otherSuperClasses;
      
      for (var i=0; i<mixins.length; i++) {
        supers.push(mixins[i]);
      }
      
      for (var i=0; i<supers.length; i++) {
        array.elements.push(supers[i]);
      }
      
      closureArgs.push(superName);

      superName = this.scope.generateUidBasedOnNode(superName);
      closureParams.push(superName);

      this.superName = superName;
      
      body.push(js_parse("inherit_multiple($n, $n);", classRef, array));
      
      //body.push(t.expressionStatement(t.callExpression(file.addHelper("inherit_multiple"), [classRef, superName])));
    } else {
      body.push(js_parse("new_prototype($n);", classRef));
    }

    //
    var decorators = this.node.decorators;
    if (decorators) {
      // create a class reference to use later on
      this.classRef = this.scope.generateUidIdentifier(classRef);

      // this is so super calls and the decorators have access to the raw function
      body.push(t.variableDeclaration("var", [t.variableDeclarator(this.classRef, classRef)]));
    }

    //
    this.buildBody();

    // make sure this class isn't directly called
    constructorBody.body.unshift(t.expressionStatement(t.callExpression(file.addHelper("class-call-check"), [t.thisExpression(), this.classRef])));

    //

    if (decorators) {
      // reverse the decorators so we execute them in the right order
      decorators = decorators.reverse();

      for (var i = 0; i < decorators.length; i++) {
        var decorator = decorators[i];

        var decoratorNode = util.template("class-decorator", {
          DECORATOR: decorator.expression,
          CLASS_REF: classRef
        }, true);
        decoratorNode.expression._ignoreModulesRemap = true;
        body.push(decoratorNode);
      }
    }

    if (this.isNativeSuper) {
      // we've determined this is inheriting from a native class so return the constructed
      // instance
      constructorBody.body.push(t.returnStatement(this.nativeSuperRef));
    }

    if (this.className) {
      // named class with only a constructor
      if (body.length === 1) return t.toExpression(body[0]);
    } else {
      // infer class name if this is a nameless class expression
      constructor = nameMethod.bare(constructor, this.parent, this.scope);

      body.unshift(t.variableDeclaration("var", [t.variableDeclarator(classRef, constructor)]));

      t.inheritsComments(body[0], this.node);
    }

    body = body.concat(this.staticPropBody);

    //

    body.push(t.returnStatement(classRef));

    return t.callExpression(t.functionExpression(null, closureParams, t.blockStatement(body)), closureArgs);
  };

  /**
   * Description
   */

  ClassTransformer.prototype.pushToMap = function pushToMap(node, enumerable) {
    var kind = arguments[2] === undefined ? "value" : arguments[2];

    var mutatorMap;
    if (node["static"]) {
      this.hasStaticDescriptors = true;
      mutatorMap = this.staticMutatorMap;
    } else {
      this.hasInstanceDescriptors = true;
      mutatorMap = this.instanceMutatorMap;
    }

    var map = defineMap.push(mutatorMap, node, kind, this.file);

    if (enumerable) {
      map.enumerable = t.literal(true);
    }

    if (map.decorators) {
      this.hasDecorators = true;
    }
  };

  /**
   * Description
   */

  ClassTransformer.prototype.buildBody = function buildBody() {
    var constructorBody = this.constructorBody;
    var constructor = this.constructor;
    var className = this.className;
    var superName = this.superName;
    var classBody = this.node.body.body;
    var body = this.body;

    var classBodyPaths = this.path.get("body").get("body");

    for (var i = 0; i < classBody.length; i++) {
      var node = classBody[i];
      var path = classBodyPaths[i];

      if (t.isMethodDefinition(node)) {
        var isConstructor = node.kind === "constructor";
        if (isConstructor) this.verifyConstructor(path);

        var replaceSupers = new ReplaceSupers({
          methodPath: path,
          methodNode: node,
          objectRef: this.classRef,
          superRef: this.superName,
          isStatic: node["static"],
          isLoose: this.isLoose,
          scope: this.scope,
          file: this.file
        }, true);

        replaceSupers.replace();

        if (isConstructor) {
          this.pushConstructor(node, path);
        } else {
          this.pushMethod(node);
        }
      } else if (t.isClassProperty(node)) {
        this.pushProperty(node);
      }
    }

    // we have no constructor, but we're a derived class
    if (!this.hasConstructor && this.hasSuper) {
      var helperName = "class-super-constructor-call";
      if (this.isLoose) helperName += "-loose";
      if (this.isNativeSuper) helperName = "class-super-native-constructor-call";
      constructorBody.body.push(util.template(helperName, {
        NATIVE_REF: this.nativeSuperRef,
        CLASS_NAME: className,
        SUPER_NAME: this.superName
      }, true));
    }

    //
    this.placePropertyInitializers();

    //
    if (this.userConstructor) {
      constructorBody.body = constructorBody.body.concat(this.userConstructor.body.body);
      t.inherits(this.constructor, this.userConstructor);
      t.inherits(this.constructorBody, this.userConstructor.body);
    }

    var instanceProps;
    var staticProps;
    var classHelper = "create-class";
    if (this.hasDecorators) classHelper = "create-decorated-class";

    if (this.hasInstanceDescriptors) {
      instanceProps = defineMap.toClassObject(this.instanceMutatorMap);
    }

    if (this.hasStaticDescriptors) {
      staticProps = defineMap.toClassObject(this.staticMutatorMap);
    }

    if (instanceProps || staticProps) {
      if (instanceProps) instanceProps = defineMap.toComputedObjectFromClass(instanceProps);
      if (staticProps) staticProps = defineMap.toComputedObjectFromClass(staticProps);

      var nullNode = t.literal(null);

      // (Constructor, instanceDescriptors, staticDescriptors, instanceInitializers, staticInitializers)
      var args = [this.classRef, nullNode, nullNode, nullNode, nullNode];

      if (instanceProps) args[1] = instanceProps;
      if (staticProps) args[2] = staticProps;

      if (this.instanceInitializersId) {
        args[3] = this.instanceInitializersId;
        body.unshift(this.buildObjectAssignment(this.instanceInitializersId));
      }

      if (this.staticInitializersId) {
        args[4] = this.staticInitializersId;
        body.unshift(this.buildObjectAssignment(this.staticInitializersId));
      }

      var lastNonNullIndex = 0;
      for (var i = 0; i < args.length; i++) {
        if (args[i] !== nullNode) lastNonNullIndex = i;
      }
      args = args.slice(0, lastNonNullIndex + 1);

      body.push(t.expressionStatement(t.callExpression(this.file.addHelper(classHelper), args)));
    }
  };

  ClassTransformer.prototype.buildObjectAssignment = function buildObjectAssignment(id) {
    return t.variableDeclaration("var", [t.variableDeclarator(id, t.objectExpression([]))]);
  };

  /**
   * Description
   */

  ClassTransformer.prototype.placePropertyInitializers = function placePropertyInitializers() {
    var body = this.instancePropBody;
    if (!body.length) return;

    if (this.hasPropertyCollision()) {
      var call = t.expressionStatement(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier(PROPERTY_COLLISION_METHOD_NAME)), []));

      this.pushMethod(t.methodDefinition(t.identifier(PROPERTY_COLLISION_METHOD_NAME), t.functionExpression(null, [], t.blockStatement(body))), true);

      if (this.hasSuper) {
        this.bareSuper.insertAfter(call);
      } else {
        this.constructorBody.body.unshift(call);
      }
    } else {
      if (this.hasSuper) {
        if (this.hasConstructor) {
          this.bareSuper.insertAfter(body);
        } else {
          this.constructorBody.body = this.constructorBody.body.concat(body);
        }
      } else {
        this.constructorBody.body = body.concat(this.constructorBody.body);
      }
    }
  };

  /**
   * Description
   */

  ClassTransformer.prototype.hasPropertyCollision = function hasPropertyCollision() {
    if (this.userConstructorPath) {
      for (var name in this.instancePropRefs) {
        if (this.userConstructorPath.scope.hasOwnBinding(name)) {
          return true;
        }
      }
    }

    return false;
  };

  /**
   * Description
   */

  ClassTransformer.prototype.verifyConstructor = function verifyConstructor(path) {
    var state = {
      nativeSuperRef: this.nativeSuperRef,
      isNativeSuper: this.isNativeSuper,
      hasBareSuper: false,
      bareSuper: null,
      hasSuper: this.hasSuper,
      file: this.file
    };

    path.get("value").traverse(verifyConstructorVisitor, state);

    this.bareSuper = state.bareSuper;

    if (!state.hasBareSuper && this.hasSuper) {
      //XXX during refactor, disable this error,
      //until all classes properly use super()
      
      //throw path.errorWithNode("Derived constructor must call super()");
    }

    if (this.isNativeSuper && this.bareSuper) {
      this.bareSuper.replaceWithMultiple([t.variableDeclaration("var", [t.variableDeclarator(this.nativeSuperRef, t.newExpression(this.superName, this.bareSuper.node.arguments))]), t.expressionStatement(t.assignmentExpression("=", t.memberExpression(this.nativeSuperRef, t.identifier("__proto__")), t.memberExpression(this.classRef, t.identifier("prototype")))), t.expressionStatement(this.nativeSuperRef)]);
    }
  };

  /**
   * Push a method to its respective mutatorMap.
   */

  ClassTransformer.prototype.pushMethod = function pushMethod(node, allowedIllegal) {
    if (!allowedIllegal && t.isLiteral(t.toComputedKey(node), { value: PROPERTY_COLLISION_METHOD_NAME })) {
      throw this.file.errorWithNode(node, messages.get("illegalMethodName", PROPERTY_COLLISION_METHOD_NAME));
    }

    if (node.kind === "method") {
      nameMethod.property(node, this.file, this.scope);

      if (this.isLoose) {
        // use assignments instead of define properties for loose classes

        var classRef = this.classRef;
        if (!node["static"]) classRef = t.memberExpression(classRef, t.identifier("prototype"));
        var methodName = t.memberExpression(classRef, node.key, node.computed);

        var expr = t.expressionStatement(t.assignmentExpression("=", methodName, node.value));
        t.inheritsComments(expr, node);
        this.body.push(expr);
        return;
      }
    }

    this.pushToMap(node);
  };

  /**
   * Description
   */

  ClassTransformer.prototype.pushProperty = function pushProperty(node) {
    var key;

    this.scope.traverse(node, collectPropertyReferencesVisitor, {
      references: this.instancePropRefs,
      scope: this.scope
    });

    if (node.decorators) {
      var body = [];
      if (node.value) body.push(t.returnStatement(node.value));
      node.value = t.functionExpression(null, [], t.blockStatement(body));
      this.pushToMap(node, true, "initializer");

      if (node["static"]) {
        var _ref;

        this.staticPropBody.push(util.template("call-static-decorator", {
          INITIALIZERS: (_ref = this, !_ref.staticInitializersId && (_ref.staticInitializersId = this.scope.generateUidIdentifier("staticInitializers")), _ref.staticInitializersId),
          CONSTRUCTOR: this.classRef,
          KEY: node.key }, true));
      } else {
        var _ref2;

        this.instancePropBody.push(util.template("call-instance-decorator", {
          INITIALIZERS: (_ref2 = this, !_ref2.instanceInitializersId && (_ref2.instanceInitializersId = this.scope.generateUidIdentifier("instanceInitializers")), _ref2.instanceInitializersId),
          KEY: node.key
        }, true));
      }
    } else {
      if (!node["static"] && node.value) {
        // add this to the instancePropBody which will be added after the super call in a derived constructor
        // or at the start of a constructor for a non-derived constructor
        this.instancePropBody.push(t.expressionStatement(t.assignmentExpression("=", t.memberExpression(t.thisExpression(), node.key), node.value)));

        node.value = null;
      }

      if (!node.value) {
        node.value = t.identifier("undefined");
      }

      // can just be added to the static map
      this.pushToMap(node, true);
    }
  };

  /**
   * Replace the constructor body of our class.
   */

  ClassTransformer.prototype.pushConstructor = function pushConstructor(method, path) {
    // https://github.com/babel/babel/issues/1077
    var fnPath = path.get("value");
    if (fnPath.scope.hasOwnBinding(this.classRef.name)) {
      fnPath.scope.rename(this.classRef.name);
    }

    var construct = this.constructor;
    var fn = method.value;

    this.userConstructorPath = fnPath;
    this.userConstructor = fn;
    this.hasConstructor = true;

    t.inheritsComments(construct, method);

    construct._ignoreUserWhitespace = true;
    construct.params = fn.params;

    t.inherits(construct.body, fn.body);
  };

  return ClassTransformer;
})();
