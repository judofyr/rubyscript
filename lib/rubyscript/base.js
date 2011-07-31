if (typeof RubyScript === "undefined")
  RubyScript = {};

RubyScript["Base"] = function() {
  function alloc(klass) {
    var obj = new klass;
    obj.ivars = {};
    obj.meta = null;
    return obj;
  };

  function metaclass(obj) {
    if (obj.meta) return obj.meta;
    var klass = function(){};
    initclass(klass, obj);
    klass.subject = obj;
    obj.meta = klass;
    return klass;
  };

  function initclass(klass, prototype) {
    if (prototype)
      klass.prototype = prototype;

    klass.__proto__ = Class.prototype;
    klass.ivars = {};
    klass.meta = null;
    klass.dummy = new klass;
  }

  function subclass(superclass) {
    var klass = function(){};
    initclass(klass, new(superclass || Object));
    return klass;
  }

  function module() {
    var mod = function(){};
    mod.__proto__ = Module.prototype;
    mod.ivars = {};
    mod.meta = null;
    return mod;
  }

  function extend(obj, mod) {
    var vklass = new mod;
    vklass.__super__ = obj.__proto__;
    obj.__proto__ = vklass;
  }

  function base(obj) {
    switch (typeof obj) {
      case 'object':
        if (obj === null)
          obj = NilClass.prototype;
        break;
      case 'number':
        obj = Fixnum.prototype;
        break;
      case 'string':
        obj = Symbol.prototype;
        break;
      case 'boolean':
        obj = (obj ? TrueClass : FalseClass).prototype;
        break;
      default:
        break;
    }
    return obj;
  }

  function lookup(obj, key) {
    while (obj !== undefined) {
      var v = obj[key];
      if (v) return v;
      obj = obj.__super__;
    }
  }

  function str(string) {
    var str = new String;
    str.content = string.valueOf();
    return str;
  }

  function BasicObject(){};
  function Object(){};
  function Module(){};
  function Class(){};

  BasicObject.prototype = null;
  Object.prototype = new BasicObject;
  Module.prototype = new Object;
  Class.prototype = new Module;

  initclass(BasicObject);
  initclass(Object);
  initclass(Module);
  initclass(Class);

  var TrueClass = subclass(),
      FalseClass = subclass(),
      NilClass = subclass(),

      Numeric = subclass(),
      Integer = subclass(Numeric),
      Fixnum = subclass(Integer),

      Symbol = subclass(),
      String = subclass();

  var TopLevel = alloc(Object);
  
  return {
    "alloc": alloc,
    "metaclass": metaclass,
    "subclass": subclass,
    "module": module,
    "extend": extend,
    "base": base,
    "lookup": lookup,
    "str": str,

    "BasicObject": BasicObject,
    "Object": Object,
    "Module": Module,
    "Class": Class,

    "TrueClass": TrueClass,
    "FalseClass": FalseClass,
    "NilClass": NilClass,

    "Numeric": Numeric,
    "Integer": Integer,
    "Fixnum": Fixnum,

    "Symbol": Symbol,
    "String": String,

    "TopLevel": TopLevel
  };
};

if (typeof module !== "undefined")
  module["exports"] = RubyScript["Base"];

