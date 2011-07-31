if (typeof RubyScript === "undefined")
  RubyScript = {};

if (!RubyScript.YARV)
  RubyScript.YARV = {};

RubyScript.YARV.Core = function(B) {
  var F = B.FrozenCore = B.alloc(B.Object);

  F["meth_core#define_method"] = function(block, klass, name, code) {
    klass.prototype["meth_" + name] = code;
  };

  function send(recv, meth, args) {
    var f = B.lookup(B.base(recv), 'meth_' + meth);
    if (!f) throw recv + ': ' + meth;
    return f.apply(recv, args);
  };
  B.send = send;

  var Kernel = B.Kernel = B.module();
  Kernel.prototype.meth_p = function(block, obj) {
    send(this, "puts", [null, send(obj, "inspect")]);
  };
  B.extend(B.Object.prototype, Kernel);

  var Fixnum = B.Fixnum;
  Fixnum.prototype["meth_-"] = function(block, other) {
    return this - other;
  };

  Fixnum.prototype["meth_+"] = function(block, other) {
    return this + other;
  };

  Fixnum.prototype["meth_<"] = function(block, other) {
    return this < other;
  }

  Fixnum.prototype["meth_inspect"] = function() {
    return B.str(this);
  };

  B.Symbol.prototype["meth_inspect"] = function() {
    return B.str(':' + this);
  }

  B.Object.globals = {};
  return B;
};

if (typeof module !== "undefined")
  module.exports = RubyScript.YARV.Core;


