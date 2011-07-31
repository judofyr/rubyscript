var spawn = require('child_process').spawn,
    fs = require('fs');

// This module communicates with ./compiler_server.rb so we can compile
// Ruby code into JavaScript on-the-run in Node.js.
//
// Because all child_process functions in Node.js are async, we
// communicate over a FIFO where we can use fs.readFileSync.
var Compiler = function(dir) {
  var c = this;
  this.dir = dir;
  this.requestFifo = dir + '/request';
  this.responseFifo = dir + '/response';

  this.ruby = "ruby";
  this.server = __dirname + '/compiler_server.rb';

  var errs = "";
  var child = this.child = spawn(this.ruby, [this.server, dir]);

  this.child.stderr.on('data', function(data) {
    errs += data;
  });

  this.child.on('exit', function(code, signal) {
    if (code) child.emit('error', errs);
  });

  this.child.stdout.on('data', function(data) {
    if (data == "Ready\n") child.emit('ready');
  });
};

Compiler.prototype.killServer = function() {
  this.child.kill();
}

Compiler.prototype.request = function(req) {
  var reqfd = fs.openSync(this.requestFifo, 'w');
  fs.writeSync(reqfd, JSON.stringify(req));
  fs.closeSync(reqfd);
  return this.read();
}

Compiler.prototype.read = function() {
  var res = fs.readFileSync(this.responseFifo);
  return JSON.parse(res.toString());
}

Compiler.prototype.compileFile = function(file) {
  if (this.cacheFiles) {
    try {
      var cached = file + 'js';
      var fstat = fs.statSync(file);
      var cstat = fs.statSync(cached);
      if (cstat.mtime > fstat.mtime)
        return fs.readFileSync(cached).toString();
    } catch(err) {
    }
  }

  var res = this.request({file: file});
  if (res.code) {
    if (this.cacheFiles) fs.writeFileSync(cached, res.code);
    return res.code;
  } else {
    throw 'weird result: ' + JSON.stringify(res);
  }
};

module.exports = Compiler;

