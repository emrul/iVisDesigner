var make_anchor_move_context = function(rslt, anchor, action) {
    if(action == "move") {
        if(anchor.type == "Plain") {
            rslt.original = anchor.obj;
            rslt.onMove = function(p0, p1) {
                anchor.obj = rslt.original.sub(p0).add(p1);
                return { trigger_render: "main" };
            };
        }
        if(anchor.type == "PointOffset") {
            rslt.original = anchor.offset;
            rslt.onMove = function(p0, p1) {
                anchor.offset = rslt.original.sub(p0).add(p1);
                return { trigger_render: "main" };
            };
        }
    }
    if(action == "move-element") {
        if(anchor.beginMoveElement) {
            var c = anchor.beginMoveElement(rslt.context);
            rslt.onMove = function(p0, p1) {
                c.onMove(p0, p1);
            };
        }
    }
    return rslt;
};

var make_prop_ctx = function(obj, property, name, group, type, args) {
    var ctx = { name: name, group: group, type: type, property: property, owner: obj, args: args };
    ctx.get = function() {
        return obj["_get_" + property]();
    };
    ctx.set = function(val) {
        return obj["_set_" + property](val);
    };
    return ctx;
};