if (typeof RubyScript === "undefined")
  RubyScript = {};

if (!RubyScript.YARV)
  RubyScript.YARV = {};

// Adds some Node.js-specific functions.
RubyScript.YARV.NodeCore = function(core) {
  var Kernel = core.Kernel;
  Kernel.prototype["meth_puts"] = function(block, str) {
    console.log(str.content)
  }

  Kernel.prototype["meth_load"] = function(block, file) {
    var code = core.compiler.compileFile(file.content);
    var runner = new Runner(core);
    runner.eval(code);
  };

  Kernel.prototype["meth_later"] = function(block) {
    setTimeout(function() {
      block.call(block.self)
    }, 0);
  }

  return core;
};

if (typeof module !== "undefined")
  module.exports = RubyScript.YARV.NodeCore;

