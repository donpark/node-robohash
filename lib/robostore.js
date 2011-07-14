(function() {
  var FS, Log, Path, Robostore, log, randomIndex;
  Log = require('log');
  log = new Log(Log.DEBUG);
  FS = require('fs');
  Path = require('path');
  randomIndex = function(array) {
    return (Math.random() * 10000 | 0) % array.length;
  };
  Robostore = (function() {
    function Robostore(baseDir) {
      var partDir, partType, subdirs, _i, _len;
      this.baseDir = baseDir;
      this.parts = {};
      subdirs = FS.readdirSync(this.baseDir);
      for (_i = 0, _len = subdirs.length; _i < _len; _i++) {
        partType = subdirs[_i];
        partDir = Path.join(this.baseDir, partType);
        if (FS.statSync(partDir).isDirectory()) {
          this.parts[partType] = FS.readdirSync(partDir);
        }
      }
    }
    Robostore.prototype.namedPart = function(type, name) {
      return Path.join(this.baseDir, type, name);
    };
    Robostore.prototype.indexedPart = function(type, index) {
      return Path.join(this.baseDir, type, this.parts[type][index]);
    };
    Robostore.prototype.randomPart = function(type) {
      return this.indexedPart(type, randomIndex(this.parts[type]));
    };
    return Robostore;
  })();
  exports.getStorage = function(path) {
    return new Robostore(path);
  };
}).call(this);
