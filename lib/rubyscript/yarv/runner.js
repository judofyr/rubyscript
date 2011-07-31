if (typeof RubyScript === "undefined")
  RubyScript = {};

if (!RubyScript.YARV)
  RubyScript.YARV = {};

-function() {
  var Runner = RubyScript.YARV.Runner = function(core) {
    this.core = core
  };

  Runner.prototype.eval = function(code) {
    var c = this.core,
        self = c.TopLevel,
        cref_ = cref = { klass: c.Object, noex: 1 },
        FrozenCore = c.FrozenCore,
        FixnumProto = c.Fixnum.prototype,
        NilProto = c.NilClass.prototype,
        SymbolProto = c.Symbol.prototype,
        TrueProto = c.TrueClass.prototype,
        FalseProto = c.FalseClass.prototype,
        Object = c.Object,
        send = c.send,
        const_get = c.const_get,
        lookup = c.lookup,
        str = c.str,
        globals = c.Object.globals,
        iseq;

    eval(code);
    iseq.call(self);
  };

  if (typeof module !== "undefined")
    module.exports = Runner;

}();

