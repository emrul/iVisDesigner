// iVisDesigner - File: scripts/node/renderslave.js
// Copyright (c) 2013-2014, Donghao Ren
// University of California Santa Barbara, Peking University
// Advised by Prof. Tobias Hollerer and previously by Prof. Xiaoru Yuan.
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
// IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Initialize SHM.
SHMConfig.init(false); // create SHM object.

// Setup canvas and renderer.
var manager = new IV.CanvasManager(2000, 2000);
var renderer = new IV.Renderer();

renderer.setCanvasManager(manager);

var add_canvas = function() {
    return IVWrappers.CreateCanvas();
};

manager.add("main", main = add_canvas());
manager.add("front", add_canvas());
manager.add("back", add_canvas());
manager.add("overlay", add_canvas());


var MessageTransportTCP = function(host, port) {
    var self = this;
    var net = require("net");
    var client;
    var do_connect = function() {
        temporary = new Buffer(0);
        client = net.connect(port, host);
        console.log("Connecting to:", host, port);
        client.on("data", function(data) {
            // var t0 = new Date().getTime();
            temporary = Buffer.concat([temporary, data]);
            while(temporary.length >= 4) {
                var length = temporary.readUInt32LE(0);
                if(temporary.length >= 4 + length) {
                    var message = temporary.slice(4, 4 + length);
                    if(self.onMessage) {
                        try {
                            self.onMessage(JSON.parse(message.toString("utf8")));
                        } catch(e) { console.trace(e); }
                    }
                    temporary = temporary.slice(4 + length);
                } else {
                    break;
                }
            }
            // var t1 = new Date().getTime();
            // console.log("on_data:", t1 - t0);
        });
        client.on("end", function() {
            do_connect();
        });
    };
    do_connect();
};

var dataset, vis;

try {
    var prefix = "/Users/donghao/Documents/Projects/iVisDesignerNative/test/data";
    var data = require(prefix + '/graph.json');
    var schema = require(prefix + '/graph.schema.json');
    var vis_data = require(prefix + '/graph.vis.inverted.json');
    var ds = new IV.PlainDataset(data, schema);
    dataset = new IV.DataObject(ds.obj, ds.schema);
    vis = IV.serializer.deserialize(vis_data);

    renderer.setData(dataset);
    renderer.setVisualization(vis);
    renderer.autoView(vis);
    renderer.trigger("main");
} catch(e) {
    console.trace(e);
}

var connection = new MessageTransportTCP("ilab-121.cs.ucsb.edu", 60100);
var index = 0;
connection.onMessage = function(object) {
    console.log(index++, object.type);
    // var t0 = new Date().getTime();
    if(object.type == "visualization.set") {
        vis = IV.serializer.deserialize(object.visualization);
        renderer.setVisualization(vis);
        renderer.autoView(vis);
        renderer.trigger("main");
    }
    if(object.type == "data.set") {
        var ds = new IV.PlainDataset(object.data, object.schema);
        dataset = new IV.DataObject(ds.obj, ds.schema);
        renderer.setData(dataset);
        renderer.setVisualization(vis);
        renderer.trigger("main");
    }
};

// This is called before each frame.
setInterval(function() {
    var t0 = new Date().getTime();
    if(vis && dataset) {
        vis.timerTick(dataset);
        vis.triggerRenderer(renderer);
    }
    if(renderer.render()) {
        var tex = SHMConfig.textures.T0;
        tex.shm.writeLock();
        tex.setTimestamp(new Date().getTime());
        main.__surface.pixels().copy(tex.buffer);
        tex.shm.writeUnlock();
    }
}, 30);
