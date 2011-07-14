Log = require('log')
log = new Log Log.DEBUG

FS = require('fs')
Path = require('path')

Async = require('async')
Canvas = require('canvas')
SVG = require('./svg')

randomBot = (robostore, outcb) ->
    # log.debug "outcb is #{typeof outcb}"
    width = height = 300
    canvas = new Canvas width, height
    Async.waterfall [
        (next) -> SVG.renderFile robostore.randomPart('background'), canvas, (err, canvas) -> next(err)
        (next) -> SVG.renderFile robostore.randomPart('body'), canvas, (err, canvas) -> next(err)
        (next) -> SVG.renderFile robostore.randomPart('face'), canvas, (err, canvas) -> next(err)
        (next) -> SVG.renderFile robostore.randomPart('eyes'), canvas, (err, canvas) -> next(err)
        (next) -> SVG.renderFile robostore.randomPart('mouth'), canvas, (err, canvas) -> next(err)
        (next) -> SVG.renderFile robostore.randomPart('accessory'), canvas, (err, canvas) -> next(err)
    ], (err) -> outcb err, canvas
    
renderPart = (robostore, type, name, canvas, outcb) ->
    file = robostore.namedPart type, name
    SVG.renderFile file, canvas, outcb

exports.randomBot = randomBot    
exports.renderPart = renderPart
