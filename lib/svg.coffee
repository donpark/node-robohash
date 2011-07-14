Log = require 'log'
log = new Log Log.DEBUG

FS = require('fs')
XML = require('node-xml')
Canvas = require('canvas')

arcToSegmentsCache = {}
segmentToBezierCache = {}

TWOPI = 2 * Math.PI

arcToSegments = (x, y, rx, ry, large, sweep, rotateX, ox, oy) ->
    argsString = Array.prototype.join.call(arguments)
    return arcToSegmentsCache[argsString] if arcToSegmentsCache[argsString]
    th = rotateX * (Math.PI / 180)
    sin_th = Math.sin(th)
    cos_th = Math.cos(th)
    rx = Math.abs(rx)
    ry = Math.abs(ry)
    px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5
    py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5
    pl = (px * px) / (rx * rx) + (py * py) / (ry * ry)
    if pl > 1
        pl = Math.sqrt(pl)
        rx *= pl
        ry *= pl
    a00 = cos_th / rx
    a01 = sin_th / rx
    a10 = ( - sin_th) / ry
    a11 = (cos_th) / ry
    x0 = a00 * ox + a01 * oy
    y0 = a10 * ox + a11 * oy
    x1 = a00 * x + a01 * y
    y1 = a10 * x + a11 * y
    d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)
    sfactor_sq = 1 / d - 0.25
    sfactor_sq = 0 if sfactor_sq < 0
    sfactor = Math.sqrt(sfactor_sq)
    sfactor = -sfactor if sweep is large
    xc = 0.5 * (x0 + x1) - sfactor * (y1 - y0)
    yc = 0.5 * (y0 + y1) + sfactor * (x1 - x0)
    th0 = Math.atan2(y0 - yc, x0 - xc)
    th1 = Math.atan2(y1 - yc, x1 - xc)
    th_arc = th1 - th0
    if th_arc < 0 and sweep is 1
        th_arc += TWOPI
    else if th_arc > 0 and sweep is 0
        th_arc -= TWOPI
    segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)))
    result = []
    for segment, i in segments
        th2 = th0 + i * th_arc / segments
        th3 = th0 + (i + 1) * th_arc / segments
        result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th]
    arcToSegmentsCache[argsString] = result

segmentToBezier = (cx, cy, th0, th1, rx, ry, sin_th, cos_th) ->
    argsString = Array.prototype.join.call(arguments)
    return segmentToBezierCache[argsString] if segmentToBezierCache[argsString]
    a00 = cos_th * rx
    a01 = -sin_th * ry
    a10 = sin_th * rx
    a11 = cos_th * ry
    th_half = 0.5 * (th1 - th0)
    t = (8 / 3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half)
    x1 = cx + Math.cos(th0) - t * Math.sin(th0)
    y1 = cy + Math.sin(th0) + t * Math.cos(th0)
    x3 = cx + Math.cos(th1)
    y3 = cy + Math.sin(th1)
    x2 = x3 + t * Math.sin(th1)
    y2 = y3 - t * Math.cos(th1)
    segmentToBezierCache[argsString] = [
        a00 * x1 + a01 * y1, a10 * x1 + a11 * y1
        a00 * x2 + a01 * y2, a10 * x2 + a11 * y2
        a00 * x3 + a01 * y3, a10 * x3 + a11 * y3
    ]

drawArc = (ctx, x, y, coords) ->
    rx = coords[0]
    ry = coords[1]
    rot = coords[2]
    large = coords[3]
    sweep = coords[4]
    ex = coords[5]
    ey = coords[6]
    segments = arcToSegments ex, ey, rx, ry, large, sweep, rot, x, y
    ctx.bezierCurveTo.apply(ctx, segmentToBezier.apply(this, segment)) for segment in segments

COLOR_RE = /^#([0-9a-f]{6})$/i

parseColor = (value) ->
    [ parseInt(value.substr(1, 2), 16), parseInt(value.substr(3, 2), 16), parseInt(value.substr(5, 2), 16)] if value.match /^#([0-9a-f]{6})$/i

parseStrokeStyle = (value) ->
    return if value is 'none'
    value # TODO: handle difference between HTML5 canvas strokeStyle and SVG stroke value

parseFillStyle = (value) ->
    return if value is 'none'
    value # TODO: handle difference between HTML5 canvas fillStyle and SVG fill value

parseFillRuleStyle = (value) ->

parseOpacity = (value) -> parseFloat value

parseTransformStyle = (value) ->
    
getAttr = (attrs, name) ->
    for attr in attrs
        return attr[1] if attr[0] is name
    
parseSize = (value) ->
    m = /(\d+)px/.exec value
    if m then parseInt(m[1]) else 0

randomIndex = (array) -> (Math.random() * 10000 | 0) % array.length
randomRange = (base, limit) -> (Math.random() * 10000 | 0) % (limit - base) + base
randomColor = -> [ randomRange(0, 256), randomRange(0, 256), randomRange(0, 256) ]

toHex = (value) ->
    result = Number(value).toString(16)
    if result.length is 2 then result else '0' + result

class SVG
    
    renderFile: (file, canvas, outcb) ->
        # log.debug "renderPart #{file}"
        svg = FS.readFileSync file, 'UTF-8'
        width = height = ctx = undefined
        ignored = [ 'g' ]
        parser = new XML.SaxParser (cb) =>
            # cb.onStartDocument ->
            cb.onStartElementNS (elem, attrs, prefix, uri, namespaces) =>
                # if elem is 'g'
                if elem is 'svg'
                    if canvas
                        width = canvas.width
                        height = canvas.height
                    else
                        width = parseSize getAttr(attrs, 'width')
                        height = parseSize getAttr(attrs, 'height')
                        # log.debug "width: #{width}, height: #{height}"
                        canvas = new Canvas width, height
                    ctx = canvas.getContext '2d'
                    # ctx.antialias = 'subpixel'
                    # ctx.patternQuality = 'best'
                    # ctx.globalCompositeOperation = 'lighter'
                    # ctx.lineWidth = 0.1
                    ctx.translate(width / 2, height / 2)
                else if elem is 'path'
                    style = getAttr(attrs, 'style')
                    if style is 'fill:#A6A8AB;' or style is 'fill:#A5A6AA;'
                        [r, g, b] = randomColor()
                        style = "fill:##{toHex(r)}#{toHex(g)}#{toHex(b)};"
                        # log.debug style
                    style = this.parseStyle style
                    d = this.parsePath getAttr(attrs, 'd')
                    if style? and d?
                        ctx.save()
                        this.applyPath d, ctx
                        this.applyStyle style, ctx if style
                        if style.fill?
                            # log.debug "filling"
                            ctx.fill()
                        if style.stroke?
                            # log.debug "stroking"
                            ctx.stroke()
                        ctx.restore()
               # else
                #     log.debug "UNKNOWN TAG: #{node.name}" if ignored.indexOf(node.name) is -1
            cb.onEndElementNS (elem, prefix, uri)  ->
                # if elem is 'g'

            cb.onError (err) -> outcb err
            cb.onEndDocument ->
                ctx.translate(- width / 2, - height / 2)
                outcb null, canvas
            
            undefined

        parser.parseString svg

    parseStyle: (data) ->
        return if not data
        result =
            fill: true
            fillColor: [0, 0, 0]
            fillOpacity: 1.0
            strokeOpacity: 1.0
        if typeof data is 'string'
            parts = data.replace(/;$/, '').split(';')
            for part in parts
                attr = part.split ':'
                key = attr[0].trim()
                value = attr[1].trim()
                switch key
                    when 'stroke'
                        result.stroke = true
                        result.strokeColor = parseColor value
                    when 'stroke-opacity'
                        result.strokeOpacity = parseOpacity value
                        # log.debug "stroke-opacity: #{value}"
                    when 'fill'
                        if value isnt 'none'
                            result.fillColor = parseColor value
                        else
                            result.fill = false
                    when 'fill-opacity'
                        result.fillOpacity = parseOpacity value
                        # log.debug "fill-opacity: #{value}"
                    when 'fill-rule'
                        result.fillRule = parseFillRuleStyle value
                    when 'opacity'
                        result.strokeOpacity = result.fillOpacity = parseOpacity value
                        # log.debug "opacity: #{value}"
                    when 'transform'
                        result.transform = parseTransformStyle value
                    else
                        log.debug "unknown style: #{key} = #{value}"
        result
    
    applyStyle: (style, ctx) ->
        if style and ctx
            strokeStyle = undefined
            fillStyle = undefined
            if style.stroke
                color = style.strokeColor
                opacity = style.strokeOpacity
                opacity ?= 1.0
                if opacity?
                    strokeStyle = "rgba(#{color}, #{opacity})"
                else
                    strokeStyle = "rgb(#{color})"
            if strokeStyle?
                log.debug "strokeStyle = #{strokeStyle}"
                ctx.strokeStyle = strokeStyle
            if style.fill
                color = style.fillColor
                color ?= [0, 0, 0]
                opacity = style.fillOpacity
                opacity ?= 0.2
                if opacity?
                    fillStyle = "rgba(#{color}, #{opacity})"
                else
                    fillStyle = "rgb(#{color})"
            if fillStyle?
                # log.debug "fillStyle = #{fillStyle}"
                ctx.fillStyle = fillStyle

    parsePath: (data) ->
        return if not data
        result = []
        parts = data.match /[a-zA-Z][^a-zA-Z]*/g
        for part in parts
            op = [ part.charAt(0) ] # opcode
            args = part.slice(1).trim().replace(/(\d)-/g, '$1###-').split(/\s|,|###/)
            # log.debug "part: '#{part}' args: [#{args}] length: #{args.length}"
            for arg in args
                if arg and arg?
                    parsed = parseFloat arg
                    log.error "invalid path data: #{part}" if isNaN parsed
                    op.push parsed
            result.push op
        result
    
    applyPath: (path, ctx, width, height) ->
        width ?= ctx.canvas.width
        height ?= ctx.canvas.height
        x = y = controlX = controlY = 0
        l = - width / 2
        t = - height / 2
        # log.debug "l: #{l}, t: #{t}"
        ctx.beginPath()
        for current in path
            # log.debug "#{current}"
            switch current[0]
                when 'l' # lineto, relative
                    # log.debug "x:#{x} + current[1]:#{current[1]} + l:#{} = #{x + current[1] + l}"
                    x += current[1]
                    y += current[2]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'L' # lineto, absolute
                    x = current[1]
                    y = current[2]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'h' # horizontal lineto, relative
                    x += current[1]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'H' # horizontal lineto, absolute
                    x = current[1]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'v' # vertical lineto, relative
                    y += current[1]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'V' # verical lineto, absolute
                    y = current[1]
                    ctx.lineTo x + l, y + t
                    # log.debug "lineTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'm' # moveTo, relative
                    x += current[1]
                    y += current[2]
                    ctx.moveTo x + l, y + t
                    # log.debug "moveTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'M' # moveTo, absolute
                    x = current[1]
                    y = current[2]
                    ctx.moveTo x + l, y + t
                    # log.debug "moveTo #{x + l}, #{y + t} x: #{x}, y: #{y}"
                when 'c' # bezierCurveTo, relative
                    tempX = x + current[5]
                    tempY = y + current[6]
                    controlX = x + current[3]
                    controlY = y + current[4]
                    ctx.bezierCurveTo x + current[1] + l, y + current[2] + t, controlX + l, controlY + t, tempX + l, tempY + t
                    x = tempX
                    y = tempY
                when 'C' # bezierCurveTo, absolute
                    x = current[5]
                    y = current[6]
                    controlX = current[3]
                    controlY = current[4]
                    ctx.bezierCurveTo current[1] + l, current[2] + t, controlX + l, controlY + t, x + l, y + t
                when 's' # shorthand cubic bezierCurveTo, relative
                    tempX = x + current[3]
                    tempY = y + current[4]
                    controlX = 2 * x - controlX
                    controlY = 2 * y - controlY
                    ctx.bezierCurveTo controlX + l, controlY + t, x + current[1] + l, y + current[2] + t, tempX + l, tempY + t
                    x = tempX
                    y = tempY
                when 'S' # shorthand cubic bezierCurveTo, absolute
                    tempX = current[3]
                    tempY = current[4]
                    controlX = 2 * x - controlX
                    controlY = 2 * y - controlY
                    ctx.bezierCurveTo controlX + l, controlY + t, current[1] + l, current[2] + t, tempX + l, tempY + t
                    x = tempX
                    y = tempY
                when 'q' # quadraticCurveTo, relative
                    x += current[3]
                    y += current[4]
                    ctx.quadraticCurveTo current[1] + l, current[2] + t, x + l, y + t
                when 'Q' # quadraticCurveTo, absolute
                    x = current[3]
                    y = current[4]
                    controlX = current[1]
                    controlY = current[2]
                    ctx.quadraticCurveTo controlX + l, controlY + t, x + l, y + t
                when 'T'
                    tempX = x
                    tempY = y
                    x = current[1]
                    y = current[2]
                    controlX = -controlX + 2 * tempX
                    controlY = -controlY + 2 * tempY
                    ctx.quadraticCurveTo controlX + l, controlY + t, x + l, y + t
                when 'a'
                    drawArc ctx, x + l, y + t, [
                        current[1]
                        current[2]
                        current[3]
                        current[4]
                        current[5]
                        current[6] + x + l
                        current[7] + y + t
                    ]
                    x += current[6]
                    y += current[7]
                when 'A'
                    drawArc ctx, x + l, y + t, [
                        current[1]
                        current[2]
                        current[3]
                        current[4]
                        current[5]
                        current[6] + l
                        current[7] + t
                    ]
                    x = current[6]
                    y = current[7]
                when 'z', 'Z'
                    ctx.closePath()

module.exports = new SVG() if exports?
window.SVG = new SVG() if window?
