if (typeof RubyScript === "undefined")
  RubyScript = {};

RubyScript.Core = function(B) {
  var send = B.send;
  var klasses = ["BasicObject", "Object", "Module",
    "Class", "TrueClass", "FalseClass", "NilClass",
    "Numeric", "Integer", "Fixnum", 
    "Symbol", "String"];

  for (var i = 0; i < klasses.length; i++) {
    var name = klasses[i];
    var klass = B[name];
    B.const_set(B.Object, name, klass);
  };

  var Kernel = B.def_module('Kernel');
  B.extend(B.Object.prototype, Kernel);

  B.def(Kernel, 'p', function(block, obj) {
    send(this, 'puts', [null, send(obj, 'inspect')]);
  });

  B.def(Kernel, 'puts', function(block, str) {
    if (typeof console !== 'undefined') {
      console.log(str.content);
    } else if (typeof print !== 'undefined') {
      print(str.content);
    }
  });

  B.def('Fixnum', 'inspect', function() {
    return B.str(this);
  });

  B.def('Symbol', 'inspect', function() {
    return B.str(':' + this);
  });

  return B;
};

if (typeof module !== "undefined")
  module.exports = RubyScript.Core;

