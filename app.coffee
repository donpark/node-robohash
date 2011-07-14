Log = require('log')
log = new Log Log.DEBUG

Express = require('express')
app = Express.createServer()

# init robohash & robostore

Robohash = require('./lib/robohash')
Robostore = require('./lib/robostore')
robostore = Robostore.getStorage "#{__dirname}/data/robostore"

# server configuration

app.configure ->
    app.set 'views', "#{__dirname}/views"
    app.set 'view engine', 'jade'
    app.use Express.bodyParser()
    app.use Express.methodOverride()
    
app.configure 'development', ->
    app.use Express.errorHandler {
        dumpExceptions: true
        showStack: true
    }

app.configure 'production', ->
    app.use Express.errorHandler()

app.configure ->
    app.use app.router
    app.use Express.static "#{__dirname}/public"

app.get '/', (req, res) ->
    res.render 'index', {
        size: 100
        rows: 8
        cols: 8
    }

app.get '/:hash', (req, res) ->
    # TODO: use hash to build bot
    # for now, just server a random bot
    Robohash.randomBot robostore, (err, canvas) ->
        if err?
            log.error err
            res.end()
        else if canvas?
            stream = canvas.createPNGStream()
            stream.on 'data', (chunk) -> res.write chunk
            stream.on 'end', -> res.end()
        else
            res.end()

app.listen 3000
log.info "listening at port 3000"
console.log "open browser to http://localhost:3000"