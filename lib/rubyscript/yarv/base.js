if (typeof RubyScript === "undefined")
  RubyScript = {};

if (!RubyScript.YARV)
  RubyScript.YARV = {};

RubyScript.YARV.Base = function(B) {
  var F = B.FrozenCore = B.alloc(B.Object);

  B.def = function def(klassname, name, code) {
    var klass;
    if (typeof klassname.prototype !== 'undefined') {
      klass = klassname;
    } else {
      klass = B[klassname];
    }
    klass.prototype['meth_' + name] = code;
  };

  B.def_module = function def_module(name) {
    if (typeof B[name] === 'undefined') {
      var mod = B[name] = B.module();
      B.const_set(B.Object, name, mod);
    }
    return B[name];
  };

  B.send = function send(recv, meth, args) {
    var f = B.lookup(B.base(recv), 'meth_' + meth);
    if (!f) throw recv + ': ' + meth;
    return f.apply(recv, args);
  };

  B.const_get = function const_get(klass, name) {
    var c = B.lookup(klass.dummy, 'const_' + name);
    if (!c) throw 'missing constant: ' + name;
    return c;
  };

  B.const_set = function const_set(klass, name, value) {
    klass.prototype['const_' + name] = value;
  };

  B.ary_to_ary = function(ary) {
    return ary;
  };

  F["meth_core#define_method"] = function(block, klass, name, code) {
    klass.prototype["meth_" + name] = code;
  };

  B.Object.globals = {};

  return B;
};

if (typeof module !== "undefined")
  module.exports = RubyScript.YARV.Base;


