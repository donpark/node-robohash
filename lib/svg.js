(function() {
  var COLOR_RE, Canvas, FS, Log, SVG, TWOPI, XML, arcToSegments, arcToSegmentsCache, drawArc, getAttr, log, parseColor, parseFillRuleStyle, parseFillStyle, parseOpacity, parseSize, parseStrokeStyle, parseTransformStyle, randomColor, randomIndex, randomRange, segmentToBezier, segmentToBezierCache, toHex;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Log = require('log');
  log = new Log(Log.DEBUG);
  FS = require('fs');
  XML = require('node-xml');
  Canvas = require('canvas');
  arcToSegmentsCache = {};
  segmentToBezierCache = {};
  TWOPI = 2 * Math.PI;
  arcToSegments = function(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
    var a00, a01, a10, a11, argsString, cos_th, d, i, pl, px, py, result, segment, segments, sfactor, sfactor_sq, sin_th, th, th0, th1, th2, th3, th_arc, x0, x1, xc, y0, y1, yc, _len;
    argsString = Array.prototype.join.call(arguments);
    if (arcToSegmentsCache[argsString]) {
      return arcToSegmentsCache[argsString];
    }
    th = rotateX * (Math.PI / 180);
    sin_th = Math.sin(th);
    cos_th = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
    py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
    pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
    if (pl > 1) {
      pl = Math.sqrt(pl);
      rx *= pl;
      ry *= pl;
    }
    a00 = cos_th / rx;
    a01 = sin_th / rx;
    a10 = (-sin_th) / ry;
    a11 = cos_th / ry;
    x0 = a00 * ox + a01 * oy;
    y0 = a10 * ox + a11 * oy;
    x1 = a00 * x + a01 * y;
    y1 = a10 * x + a11 * y;
    d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
    sfactor_sq = 1 / d - 0.25;
    if (sfactor_sq < 0) {
      sfactor_sq = 0;
    }
    sfactor = Math.sqrt(sfactor_sq);
    if (sweep === large) {
      sfactor = -sfactor;
    }
    xc = 0.5 * (x0 + x1) - sfactor * (y1 - y0);
    yc = 0.5 * (y0 + y1) + sfactor * (x1 - x0);
    th0 = Math.atan2(y0 - yc, x0 - xc);
    th1 = Math.atan2(y1 - yc, x1 - xc);
    th_arc = th1 - th0;
    if (th_arc < 0 && sweep === 1) {
      th_arc += TWOPI;
    } else if (th_arc > 0 && sweep === 0) {
      th_arc -= TWOPI;
    }
    segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
    result = [];
    for (i = 0, _len = segments.length; i < _len; i++) {
      segment = segments[i];
      th2 = th0 + i * th_arc / segments;
      th3 = th0 + (i + 1) * th_arc / segments;
      result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
    }
    return arcToSegmentsCache[argsString] = result;
  };
  segmentToBezier = function(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
    var a00, a01, a10, a11, argsString, t, th_half, x1, x2, x3, y1, y2, y3;
    argsString = Array.prototype.join.call(arguments);
    if (segmentToBezierCache[argsString]) {
      return segmentToBezierCache[argsString];
    }
    a00 = cos_th * rx;
    a01 = -sin_th * ry;
    a10 = sin_th * rx;
    a11 = cos_th * ry;
    th_half = 0.5 * (th1 - th0);
    t = (8 / 3) * Math.sin(th_half * 0.5) * Math.sin(th_half * 0.5) / Math.sin(th_half);
    x1 = cx + Math.cos(th0) - t * Math.sin(th0);
    y1 = cy + Math.sin(th0) + t * Math.cos(th0);
    x3 = cx + Math.cos(th1);
    y3 = cy + Math.sin(th1);
    x2 = x3 + t * Math.sin(th1);
    y2 = y3 - t * Math.cos(th1);
    return segmentToBezierCache[argsString] = [a00 * x1 + a01 * y1, a10 * x1 + a11 * y1, a00 * x2 + a01 * y2, a10 * x2 + a11 * y2, a00 * x3 + a01 * y3, a10 * x3 + a11 * y3];
  };
  drawArc = function(ctx, x, y, coords) {
    var ex, ey, large, rot, rx, ry, segment, segments, sweep, _i, _len, _results;
    rx = coords[0];
    ry = coords[1];
    rot = coords[2];
    large = coords[3];
    sweep = coords[4];
    ex = coords[5];
    ey = coords[6];
    segments = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    _results = [];
    for (_i = 0, _len = segments.length; _i < _len; _i++) {
      segment = segments[_i];
      _results.push(ctx.bezierCurveTo.apply(ctx, segmentToBezier.apply(this, segment)));
    }
    return _results;
  };
  COLOR_RE = /^#([0-9a-f]{6})$/i;
  parseColor = function(value) {
    if (value.match(/^#([0-9a-f]{6})$/i)) {
      return [parseInt(value.substr(1, 2), 16), parseInt(value.substr(3, 2), 16), parseInt(value.substr(5, 2), 16)];
    }
  };
  parseStrokeStyle = function(value) {
    if (value === 'none') {
      return;
    }
    return value;
  };
  parseFillStyle = function(value) {
    if (value === 'none') {
      return;
    }
    return value;
  };
  parseFillRuleStyle = function(value) {};
  parseOpacity = function(value) {
    return parseFloat(value);
  };
  parseTransformStyle = function(value) {};
  getAttr = function(attrs, name) {
    var attr, _i, _len;
    for (_i = 0, _len = attrs.length; _i < _len; _i++) {
      attr = attrs[_i];
      if (attr[0] === name) {
        return attr[1];
      }
    }
  };
  parseSize = function(value) {
    var m;
    m = /(\d+)px/.exec(value);
    if (m) {
      return parseInt(m[1]);
    } else {
      return 0;
    }
  };
  randomIndex = function(array) {
    return (Math.random() * 10000 | 0) % array.length;
  };
  randomRange = function(base, limit) {
    return (Math.random() * 10000 | 0) % (limit - base) + base;
  };
  randomColor = function() {
    return [randomRange(0, 256), randomRange(0, 256), randomRange(0, 256)];
  };
  toHex = function(value) {
    var result;
    result = Number(value).toString(16);
    if (result.length === 2) {
      return result;
    } else {
      return '0' + result;
    }
  };
  SVG = (function() {
    function SVG() {}
    SVG.prototype.renderFile = function(file, canvas, outcb) {
      var ctx, height, ignored, parser, svg, width;
      svg = FS.readFileSync(file, 'UTF-8');
      width = height = ctx = void 0;
      ignored = ['g'];
      parser = new XML.SaxParser(__bind(function(cb) {
        cb.onStartElementNS(__bind(function(elem, attrs, prefix, uri, namespaces) {
          var b, d, g, r, style, _ref;
          if (elem === 'svg') {
            if (canvas) {
              width = canvas.width;
              height = canvas.height;
            } else {
              width = parseSize(getAttr(attrs, 'width'));
              height = parseSize(getAttr(attrs, 'height'));
              canvas = new Canvas(width, height);
            }
            ctx = canvas.getContext('2d');
            return ctx.translate(width / 2, height / 2);
          } else if (elem === 'path') {
            style = getAttr(attrs, 'style');
            if (style === 'fill:#A6A8AB;' || style === 'fill:#A5A6AA;') {
              _ref = randomColor(), r = _ref[0], g = _ref[1], b = _ref[2];
              style = "fill:#" + (toHex(r)) + (toHex(g)) + (toHex(b)) + ";";
            }
            style = this.parseStyle(style);
            d = this.parsePath(getAttr(attrs, 'd'));
            if ((style != null) && (d != null)) {
              ctx.save();
              this.applyPath(d, ctx);
              if (style) {
                this.applyStyle(style, ctx);
              }
              if (style.fill != null) {
                ctx.fill();
              }
              if (style.stroke != null) {
                ctx.stroke();
              }
              return ctx.restore();
            }
          }
        }, this));
        cb.onEndElementNS(function(elem, prefix, uri) {});
        cb.onError(function(err) {
          return outcb(err);
        });
        cb.onEndDocument(function() {
          ctx.translate(-width / 2, -height / 2);
          return outcb(null, canvas);
        });
        return;
      }, this));
      return parser.parseString(svg);
    };
    SVG.prototype.parseStyle = function(data) {
      var attr, key, part, parts, result, value, _i, _len;
      if (!data) {
        return;
      }
      result = {
        fill: true,
        fillColor: [0, 0, 0],
        fillOpacity: 1.0,
        strokeOpacity: 1.0
      };
      if (typeof data === 'string') {
        parts = data.replace(/;$/, '').split(';');
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          attr = part.split(':');
          key = attr[0].trim();
          value = attr[1].trim();
          switch (key) {
            case 'stroke':
              result.stroke = true;
              result.strokeColor = parseColor(value);
              break;
            case 'stroke-opacity':
              result.strokeOpacity = parseOpacity(value);
              break;
            case 'fill':
              if (value !== 'none') {
                result.fillColor = parseColor(value);
              } else {
                result.fill = false;
              }
              break;
            case 'fill-opacity':
              result.fillOpacity = parseOpacity(value);
              break;
            case 'fill-rule':
              result.fillRule = parseFillRuleStyle(value);
              break;
            case 'opacity':
              result.strokeOpacity = result.fillOpacity = parseOpacity(value);
              break;
            case 'transform':
              result.transform = parseTransformStyle(value);
              break;
            default:
              log.debug("unknown style: " + key + " = " + value);
          }
        }
      }
      return result;
    };
    SVG.prototype.applyStyle = function(style, ctx) {
      var color, fillStyle, opacity, strokeStyle;
      if (style && ctx) {
        strokeStyle = void 0;
        fillStyle = void 0;
        if (style.stroke) {
          color = style.strokeColor;
          opacity = style.strokeOpacity;
                    if (opacity != null) {
            opacity;
          } else {
            opacity = 1.0;
          };
          if (opacity != null) {
            strokeStyle = "rgba(" + color + ", " + opacity + ")";
          } else {
            strokeStyle = "rgb(" + color + ")";
          }
        }
        if (strokeStyle != null) {
          log.debug("strokeStyle = " + strokeStyle);
          ctx.strokeStyle = strokeStyle;
        }
        if (style.fill) {
          color = style.fillColor;
                    if (color != null) {
            color;
          } else {
            color = [0, 0, 0];
          };
          opacity = style.fillOpacity;
                    if (opacity != null) {
            opacity;
          } else {
            opacity = 0.2;
          };
          if (opacity != null) {
            fillStyle = "rgba(" + color + ", " + opacity + ")";
          } else {
            fillStyle = "rgb(" + color + ")";
          }
        }
        if (fillStyle != null) {
          return ctx.fillStyle = fillStyle;
        }
      }
    };
    SVG.prototype.parsePath = function(data) {
      var arg, args, op, parsed, part, parts, result, _i, _j, _len, _len2;
      if (!data) {
        return;
      }
      result = [];
      parts = data.match(/[a-zA-Z][^a-zA-Z]*/g);
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        op = [part.charAt(0)];
        args = part.slice(1).trim().replace(/(\d)-/g, '$1###-').split(/\s|,|###/);
        for (_j = 0, _len2 = args.length; _j < _len2; _j++) {
          arg = args[_j];
          if (arg && (arg != null)) {
            parsed = parseFloat(arg);
            if (isNaN(parsed)) {
              log.error("invalid path data: " + part);
            }
            op.push(parsed);
          }
        }
        result.push(op);
      }
      return result;
    };
    SVG.prototype.applyPath = function(path, ctx, width, height) {
      var controlX, controlY, current, l, t, tempX, tempY, x, y, _i, _len, _results;
            if (width != null) {
        width;
      } else {
        width = ctx.canvas.width;
      };
            if (height != null) {
        height;
      } else {
        height = ctx.canvas.height;
      };
      x = y = controlX = controlY = 0;
      l = -width / 2;
      t = -height / 2;
      ctx.beginPath();
      _results = [];
      for (_i = 0, _len = path.length; _i < _len; _i++) {
        current = path[_i];
        _results.push((function() {
          switch (current[0]) {
            case 'l':
              x += current[1];
              y += current[2];
              return ctx.lineTo(x + l, y + t);
            case 'L':
              x = current[1];
              y = current[2];
              return ctx.lineTo(x + l, y + t);
            case 'h':
              x += current[1];
              return ctx.lineTo(x + l, y + t);
            case 'H':
              x = current[1];
              return ctx.lineTo(x + l, y + t);
            case 'v':
              y += current[1];
              return ctx.lineTo(x + l, y + t);
            case 'V':
              y = current[1];
              return ctx.lineTo(x + l, y + t);
            case 'm':
              x += current[1];
              y += current[2];
              return ctx.moveTo(x + l, y + t);
            case 'M':
              x = current[1];
              y = current[2];
              return ctx.moveTo(x + l, y + t);
            case 'c':
              tempX = x + current[5];
              tempY = y + current[6];
              controlX = x + current[3];
              controlY = y + current[4];
              ctx.bezierCurveTo(x + current[1] + l, y + current[2] + t, controlX + l, controlY + t, tempX + l, tempY + t);
              x = tempX;
              return y = tempY;
            case 'C':
              x = current[5];
              y = current[6];
              controlX = current[3];
              controlY = current[4];
              return ctx.bezierCurveTo(current[1] + l, current[2] + t, controlX + l, controlY + t, x + l, y + t);
            case 's':
              tempX = x + current[3];
              tempY = y + current[4];
              controlX = 2 * x - controlX;
              controlY = 2 * y - controlY;
              ctx.bezierCurveTo(controlX + l, controlY + t, x + current[1] + l, y + current[2] + t, tempX + l, tempY + t);
              x = tempX;
              return y = tempY;
            case 'S':
              tempX = current[3];
              tempY = current[4];
              controlX = 2 * x - controlX;
              controlY = 2 * y - controlY;
              ctx.bezierCurveTo(controlX + l, controlY + t, current[1] + l, current[2] + t, tempX + l, tempY + t);
              x = tempX;
              return y = tempY;
            case 'q':
              x += current[3];
              y += current[4];
              return ctx.quadraticCurveTo(current[1] + l, current[2] + t, x + l, y + t);
            case 'Q':
              x = current[3];
              y = current[4];
              controlX = current[1];
              controlY = current[2];
              return ctx.quadraticCurveTo(controlX + l, controlY + t, x + l, y + t);
            case 'T':
              tempX = x;
              tempY = y;
              x = current[1];
              y = current[2];
              controlX = -controlX + 2 * tempX;
              controlY = -controlY + 2 * tempY;
              return ctx.quadraticCurveTo(controlX + l, controlY + t, x + l, y + t);
            case 'a':
              drawArc(ctx, x + l, y + t, [current[1], current[2], current[3], current[4], current[5], current[6] + x + l, current[7] + y + t]);
              x += current[6];
              return y += current[7];
            case 'A':
              drawArc(ctx, x + l, y + t, [current[1], current[2], current[3], current[4], current[5], current[6] + l, current[7] + t]);
              x = current[6];
              return y = current[7];
            case 'z':
            case 'Z':
              return ctx.closePath();
          }
        })());
      }
      return _results;
    };
    return SVG;
  })();
  if (typeof exports !== "undefined" && exports !== null) {
    module.exports = new SVG();
  }
  if (typeof window !== "undefined" && window !== null) {
    window.SVG = new SVG();
  }
}).call(this);
