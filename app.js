(function() {
  var Express, Log, Robohash, Robostore, app, log, robostore;
  Log = require('log');
  log = new Log(Log.DEBUG);
  Express = require('express');
  app = Express.createServer();
  Robohash = require('./lib/robohash');
  Robostore = require('./lib/robostore');
  robostore = Robostore.getStorage("" + __dirname + "/data/robostore");
  app.configure(function() {
    app.set('views', "" + __dirname + "/views");
    app.set('view engine', 'jade');
    app.use(Express.bodyParser());
    return app.use(Express.methodOverride());
  });
  app.configure('development', function() {
    return app.use(Express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(Express.errorHandler());
  });
  app.configure(function() {
    app.use(app.router);
    return app.use(Express.static("" + __dirname + "/public"));
  });
  app.get('/', function(req, res) {
    return res.render('index', {
      size: 100,
      rows: 8,
      cols: 8
    });
  });
  app.get('/:hash', function(req, res) {
    return Robohash.randomBot(robostore, function(err, canvas) {
      var stream;
      if (err != null) {
        log.error(err);
        return res.end();
      } else if (canvas != null) {
        stream = canvas.createPNGStream();
        stream.on('data', function(chunk) {
          return res.write(chunk);
        });
        return stream.on('end', function() {
          return res.end();
        });
      } else {
        return res.end();
      }
    });
  });
  app.listen(3000);
  log.info("listening at port 3000");
  console.log("open browser to http://localhost:3000");
}).call(this);
