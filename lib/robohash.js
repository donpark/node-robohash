(function() {
  var Async, Canvas, FS, Log, Path, SVG, log, randomBot, renderPart;
  Log = require('log');
  log = new Log(Log.DEBUG);
  FS = require('fs');
  Path = require('path');
  Async = require('async');
  Canvas = require('canvas');
  SVG = require('./svg');
  randomBot = function(robostore, outcb) {
    var canvas, height, width;
    width = height = 300;
    canvas = new Canvas(width, height);
    return Async.waterfall([
      function(next) {
        return SVG.renderFile(robostore.randomPart('background'), canvas, function(err, canvas) {
          return next(err);
        });
      }, function(next) {
        return SVG.renderFile(robostore.randomPart('body'), canvas, function(err, canvas) {
          return next(err);
        });
      }, function(next) {
        return SVG.renderFile(robostore.randomPart('face'), canvas, function(err, canvas) {
          return next(err);
        });
      }, function(next) {
        return SVG.renderFile(robostore.randomPart('eyes'), canvas, function(err, canvas) {
          return next(err);
        });
      }, function(next) {
        return SVG.renderFile(robostore.randomPart('mouth'), canvas, function(err, canvas) {
          return next(err);
        });
      }, function(next) {
        return SVG.renderFile(robostore.randomPart('accessory'), canvas, function(err, canvas) {
          return next(err);
        });
      }
    ], function(err) {
      return outcb(err, canvas);
    });
  };
  renderPart = function(robostore, type, name, canvas, outcb) {
    var file;
    file = robostore.namedPart(type, name);
    return SVG.renderFile(file, canvas, outcb);
  };
  exports.randomBot = randomBot;
  exports.renderPart = renderPart;
}).call(this);
