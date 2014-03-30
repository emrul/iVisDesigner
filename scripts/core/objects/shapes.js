//. iVisDesigner - File: scripts/core/objects/shapes.js
//. Copyright 2013-2014 Donghao Ren
//. Peking University, University of California, Santa Barbara
//. See LICENSE.md for more information.

Objects.Shape = IV.extend(Objects.Object,function(info) {
    this.path = info.path;
    if(info.style)
        this.style = info.style;
    else
        this.style = new Objects.PathStyle(this.type);
    if(info.filter)
        this.filter = info.filter;
    else
        this.filter = null;
}, {
    $auto_properties: [ "path", "filter" ],
    render: function(g, data) {
        var $this = this;
        $this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            $this.shapePaths(context, function(path) {
                $this.style.renderPath(context, g, path);
            });
        });
    },
    renderSelected: function(g, data, context) {
        var $this = this;
        var draw_with_context = function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            $this.shapePaths(context, function(path) {
                $this.style.renderSelection(context, g, path);
            });
        };
        if(context) draw_with_context(context);
        else $this.path.enumerate(data, draw_with_context);
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Object.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "path", "Selector", "Shape", "path"),
            make_prop_ctx($this, "filter", "Filter", "Shape", "filter")
        ]);
    }
});

Objects.Circle = IV.extend(Objects.Shape, function(info) {
    this.type = "Circle";
    Objects.Shape.call(this, info);
    // Center.
    this.center = info.center ? info.center : new Objects.Plain(new IV.Vector(0, 0));
    this.radius = info.radius ? info.radius : new Objects.Plain(2);
}, {
    $auto_properties: [ "radius", "center" ],
    shapePaths: function(context, cb) {
        var c = this.center.getPoint(context);
        var r = this.radius.get(context);
        if(c === null || r === null) return;
        cb([ "C", c, r ]);
    },
    can: function(cap) {
        if(cap == "get-point") return true;
    },
    get: function(context) {
        return this.center.getPoint(context);
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "center", "Center", "Shape", "point"),
            make_prop_ctx($this, "radius", "Radius", "Shape", "number")
        ]);
    },
    select: function(pt, data, action) {
        var rslt = null;
        var $this = this;
        this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            var c = $this.center.getPoint(context);
            var radius = $this.radius.get(context);
            if(c === null || radius === null) return;
            var d = Math.abs(pt.distance(c) - radius);
            if(d <= 4.0 / pt.view_scale) {
                if(!rslt || rslt.distance > d) {
                    rslt = { distance: d, context: context.clone() };
                    make_anchor_move_context(rslt, $this.center, action);
                }
            }
        });
        return rslt;
    },
    lasso: function(polygon, data, callback) {
        var $this = this;
        var contexts = [];
        this.path.enumerate(data, function(context) {
            var c = $this.center.getPoint(context);
            if(c) {
                if(IV.geometry.insidePolygon(polygon, c)) {
                    callback($this, context);
                }
            }
        });
        if(contexts.length == 0) return null;
        return contexts;
    },
    beginMoveElement: function(context) {
        return this.center.beginMoveElement(context);
    }
});

Objects.Line = IV.extend(Objects.Shape, function(info) {
    this.type = "Line";
    Objects.Shape.call(this, info);
    this.point1 = info.point1;
    this.point2 = info.point2;
}, {
    $auto_properties: [ "point1", "point2" ],
    shapePaths: function(context, cb) {
        var p1 = this.point1.getPoint(context);
        var p2 = this.point2.getPoint(context);
        if(p1 === null || p2 === null) return;
        cb([ "M", p1, "L", p2 ]);
    },
    getLine: function(context) {
        var p1 = this.point1.getPoint(context);
        var p2 = this.point2.getPoint(context);
        if(p1 === null || p2 === null) return null;
        return [p1, p2];
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "point1", "Point1", "Shape", "point"),
            make_prop_ctx($this, "point2", "Point2", "Shape", "point")
        ]);
    },
    select: function(pt, data, action) {
        var rslt = null;
        var $this = this;
        var anchor_selected = false;
        this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            var p1 = $this.point1.getPoint(context);
            var p2 = $this.point2.getPoint(context);
            if(p1 === null || p2 === null) return;
            var threshold = 4.0 / pt.view_scale, d;
            d = Math.abs(pt.distance(p1));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point1, action);
                anchor_selected = true;
            }
            d = Math.abs(pt.distance(p2));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point2, action);
                anchor_selected = true;
            }
            d = IV.geometry.pointLineSegmentDistance(pt, p1, p2);
            if(!anchor_selected && d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
            }
        });
        return rslt;
    },
    lasso: function(polygon, data, callback) {
        var $this = this;
        var contexts = [];
        this.path.enumerate(data, function(context) {
            var p1 = $this.point1.getPoint(context);
            var p2 = $this.point2.getPoint(context);
            if(p1 && p2) {
                if(IV.geometry.lineIntersectPolygon(polygon, p1, p2)) {
                    callback($this, context);
                }
            }
        });
        if(contexts.length == 0) return null;
        return contexts;
    }
});

Objects.Arc = IV.extend(Objects.Shape, function(info) {
    this.type = "Arc";
    Objects.Shape.call(this, info);
    this.point1 = info.point1;
    this.point2 = info.point2;
    this.radius = info.radius;
}, {
    $auto_properties: [ "point1", "point2", "radius" ],
    shapePaths: function(context, cb) {
        var p1 = this.point1.getPoint(context);
        var p2 = this.point2.getPoint(context);
        var r = this.radius.get(context);
        if(p1 === null || p2 === null || r === null) return;
        var dir = p2.sub(p1).rotate90().normalize();
        var l = p2.sub(p1).length() / 2;
        r *= p2.sub(p1).length();
        if(l > r) return;
        var c = p1.add(p2).scale(0.5);
        var tr = l * l / Math.sqrt(r * r - l * l);
        var q = c.add(dir.scale(tr));
        cb([ "M", p1, "AT", q, p2, Math.abs(r) ]);
    },
    getLine: function(context) {
        var p1 = this.point1.getPoint(context);
        var p2 = this.point2.getPoint(context);
        if(p1 === null || p2 === null) return null;
        return [p1, p2];
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "point1", "Point1", "Shape", "point"),
            make_prop_ctx($this, "point2", "Point2", "Shape", "point"),
            make_prop_ctx($this, "radius", "Radius", "Shape", "number")
        ]);
    },
    select: function(pt, data, action) {
        var rslt = null;
        var $this = this;
        var anchor_selected = false;
        this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            var p1 = $this.point1.getPoint(context);
            var p2 = $this.point2.getPoint(context);
            if(p1 === null || p2 === null) return;
            var threshold = 4.0 / pt.view_scale, d;
            d = Math.abs(pt.distance(p1));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point1, action);
                anchor_selected = true;
            }
            d = Math.abs(pt.distance(p2));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point2, action);
                anchor_selected = true;
            }
            d = IV.geometry.pointLineSegmentDistance(pt, p1, p2);
            if(!anchor_selected && d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
            }
        });
        return rslt;
    },
    lasso: function(polygon, data, callback) {
        var $this = this;
        var contexts = [];
        this.path.enumerate(data, function(context) {
            var p1 = $this.point1.getPoint(context);
            var p2 = $this.point2.getPoint(context);
            if(p1 && p2) {
                if(IV.geometry.lineIntersectPolygon(polygon, p1, p2)) {
                    callback($this, context);
                }
            }
        });
        if(contexts.length == 0) return null;
        return contexts;
    }
});

Objects.Polyline = IV.extend(Objects.Shape, function(info) {
    this.type = "Polyline";
    Objects.Shape.call(this, info);
    this.points = info.points;
    this.curved = info.curved ? true : false;
    this.closed = info.closed ? true : false;
}, {
    $auto_properties: [ "curved", "closed" ],
    postDeserialize: function() {
        if(!this.curved) this.curved = false;
        if(!this.closed) this.closed = false;
    },
    shapePaths: function(context, cb) {
        var pts = this.points.map(function(p) { return p.getPoint(context); });
        var desc = ["M", pts[0], this.curved ? "CATMULLROM" : "POLYLINE", pts.length, this.closed ? "C" : "L"];
        for(var i in pts) {
            if(pts[i] === null) return;
            desc.push(pts[i]);
        }
        cb(desc);
    },
    select: function(pt, data, action) {
        var rslt = null;
        var $this = this;
        this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            var p1 = null;
            var threshold = 4.0 / pt.view_scale, d, anchor_selected = false;
            for(var i = 0; i < $this.points.length; i++) {
                var p2 = $this.points[i].getPoint(context);
                if(p2 === null) return;
                d = Math.abs(pt.distance(p2));
                if(d < threshold && (!rslt || rslt.distance > d)) {
                    rslt = { distance: d, context: context.clone() };
                    make_anchor_move_context(rslt, $this.points[i], action);
                    anchor_selected = true;
                }
                if(p1 !== null) {
                    d = IV.geometry.pointLineSegmentDistance(pt, p1, p2);
                    if(!anchor_selected && d < threshold && (!rslt || rslt.distance > d)) {
                        rslt = { distance: d, context: context.clone() };
                    }
                }
                p1 = p2;
            }
        });
        return rslt;
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "closed", "Closed", "Shape", "plain-bool"),
            make_prop_ctx($this, "curved", "Curved", "Shape", "plain-bool")
        ]);
    },
});

Objects.Bar = IV.extend(Objects.Shape, function(info) {
    this.type = "Bar";
    Objects.Shape.call(this, info);
    this.point1 = info.point1;
    this.point2 = info.point2;
    this.width = info.width;
}, {
    $auto_properties: [ "width", "point1", "point2" ],
    shapePaths: function(context, cb) {
        var p1 = this.point1.getPoint(context);
        var p2 = this.point2.getPoint(context);
        if(p1 === null || p2 === null) return;
        var d = p1.sub(p2).normalize().rotate90().scale(0.5 * this.width.get(context));
        cb([
            "M", p1.add(d),
            "L", p1.sub(d),
            "L", p2.sub(d),
            "L", p2.add(d),
            "Z"
        ]);
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "point1", "Point1", "Shape", "point"),
            make_prop_ctx($this, "point2", "Point2", "Shape", "point"),
            make_prop_ctx($this, "width", "Width", "Shape", "number")
        ]);
    },
    select: function(pt, data, action) {
        var rslt = null;
        var $this = this;
        this.path.enumerate(data, function(context) {
            if($this.filter && !$this.filter.get(context)) return;
            var p1 = $this.point1.getPoint(context);
            var p2 = $this.point2.getPoint(context);
            if(p1 === null || p2 === null) return;
            var threshold = 4.0 / pt.view_scale, d, anchor_selected = false;
            d = Math.abs(pt.distance(p1));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point1, action);
                anchor_selected = true;
            }
            d = Math.abs(pt.distance(p2));
            if(d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
                make_anchor_move_context(rslt, $this.point2, action);
                anchor_selected = true;
            }
            d = IV.geometry.pointLineSegmentDistance(pt, p1, p2);
            if(!anchor_selected && d < threshold && (!rslt || rslt.distance > d)) {
                rslt = { distance: d, context: context.clone() };
            }
        });
        return rslt;
    }
});

Objects.LineThrough = IV.extend(Objects.Shape, function(info) {
    this.type = "LineThrough";
    Objects.Shape.call(this, info);
    this.points = info.points;
    this.curved = false;
    this.closed = false;
}, {
    $auto_properties: [ "curved", "closed", "points" ],
    postDeserialize: function() {
        if(!this.curved) this.curved = false;
        if(!this.closed) this.closed = false;
    },
    shapePaths: function(context, cb) {
        var $this = this;
        var line = [];
        $this.points.getPath().enumerateAtContext(context, function(ctx) {
            var pt = $this.points.getPoint(ctx);
            if(pt === null) return;
            line.push(pt);
        });
        if(line.length >= 2) {
            var desc = ["M", line[0], $this.curved ? "CATMULLROM" : "POLYLINE", line.length, $this.closed ? "C" : "L"];
            cb(desc.concat(line));
        }
    },
    can: function(cap) {
        if(cap == "get-point") return true;
    },
    get: function(context) {
        return this.points.getPoint(context);
    },
    select: function(pt, data, action) {
        if(action == "move-element") return null;
        var rslt = null;
        var $this = this;
        $this.path.enumerate(data, function(fctx) {
            if($this.filter && !$this.filter.get(context)) return;
            var pts = [];
            $this.points.getPath().enumerateAtContext(fctx, function(context) {
                var pt = $this.points.getPoint(context);
                if(pt !== null)
                    pts.push(pt);
            });
            for(var i = 0; i < pts.length - 1; i++) {
                var d = IV.geometry.pointLineSegmentDistance(pt, pts[i], pts[i + 1]);
                if(d <= 4.0 / pt.view_scale) {
                    if(!rslt || rslt.distance > d)
                        rslt = { distance: d, context: fctx.clone() };
                }
            }
        });
        return rslt;
    },
    lasso: function(polygon, data, callback) {
        var $this = this;
        var contexts = [];
        this.path.enumerate(data, function(fctx) {
            var pts = [];
            $this.points.getPath().enumerateAtContext(fctx, function(context) {
                var pt = $this.points.getPoint(context);
                if(pt !== null)
                    pts.push(pt);
            });
            for(var i = 0; i < pts.length - 1; i++) {
                var p1 = pts[i];
                var p2 = pts[i + 1];
                if(IV.geometry.lineIntersectPolygon(polygon, p1, p2)) {
                    callback($this, fctx);
                }
            }
        });
        if(contexts.length == 0) return null;
        return contexts;
    },
    getPropertyContext: function() {
        var $this = this;
        return Objects.Shape.prototype.getPropertyContext.call(this).concat([
            make_prop_ctx($this, "points", "Points", "Shape", "point"),
            make_prop_ctx($this, "closed", "Closed", "Shape", "plain-bool"),
            make_prop_ctx($this, "curved", "Curved", "Shape", "plain-bool")
        ]);
    }
});

IV.serializer.registerObjectType("Circle", Objects.Circle);
IV.serializer.registerObjectType("Line", Objects.Line);
IV.serializer.registerObjectType("Arc", Objects.Arc);
IV.serializer.registerObjectType("Bar", Objects.Bar);
IV.serializer.registerObjectType("LineThrough", Objects.LineThrough);
IV.serializer.registerObjectType("Polyline", Objects.Polyline);
