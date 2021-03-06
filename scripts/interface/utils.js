// iVisDesigner - scripts/interface/utils.js
// Author: Donghao Ren
//
// LICENSE
//
// Copyright (c) 2014, The Regents of the University of California
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this
//    list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors
//    may be used to endorse or promote products derived from this software without
//    specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
// OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE.

(function() {
    var object_types = { };

    IV.registerObjectType = function(c, func, args) {
        object_types[c] = func;
        var keys = args ? args.split(",") : [];
        if(keys.indexOf("unique") >= 0)
            func._is_unique = true;
        $(c).each(function() {
            var d = $(this).data();
            if(func._is_unique && d["__objtype_" + c]) return;
            d["__objtype_" + c] = true;
            func.call($(this));
        });
    };

    document.body.addEventListener("DOMNodeInserted", function(event) {
        var $new_element = $(event.target);
        for(var c in object_types) {
            $new_element.find(c).each(function() {
                var func = object_types[c];
                var d = $(this).data();
                if(func._is_unique && d["__objtype_" + c]) return;
                d["__objtype_" + c] = true;
                func.call($(this));
            });
        }
    }, false);
})();

// data-apply-children
IV.registerObjectType("[data-apply-children]", function() {
    var attr = $(this).attr("data-apply-children");
    var kvs = attr.split(";").map(function(x) {
        var k = x.split("=");
        return { key: k[0], value: k[1] };
    });
    $(this).children().each(function() {
        var $this = $(this);
        if($this.attr("data-apply-children-resist")) return;
        kvs.forEach(function(t) {
            $this.attr(t.key, t.value);
        });
    });
}, "unique");
// data-remove-text-nodes
IV.registerObjectType("[data-remove-text-nodes]", function() {
    $(this).contents().filter(function() { return this.nodeType === 3; }).remove();
}, "unique");
// data-switch
IV.registerObjectType("span[data-switch]", function() {
    var key = $(this).attr("data-switch");
    var value = $(this).attr("data-value");
    var $this = $(this);
    if(!IV.exists(key)) IV.add(key, "string");
    IV.listen(key, function(v) {
        if(v == value) {
            $this.addClass("active");
        } else {
            $this.removeClass("active");
        }
    });
    $(this).click(function() {
        IV.set(key, value);
    });
}, "unique");
// data-toggle
IV.registerObjectType("span[data-toggle]", function() {
    var id = $(this).attr("data-toggle");
    if(id[0] == "#") {
        $(id).data().toggle_selector = $(this);
        if($(id).is(":visible")) {
            $(this).addClass("toggle-on");
        } else {
            $(this).removeClass("toggle-on");
        }
        $(this).click(function() {
            $(id).toggle();
            $(this).toggleClass("toggle-on");
        });
    } else {
        if(!IV.exists(id)) IV.add(id, "bool");
        var th = $(this);
        var f = function() {
            if(IV.get(id)) {
                th.addClass("toggle-on");
            } else {
                th.removeClass("toggle-on");
            }
        };
        IV.listen(id, f);
        f();
        $(this).click(function() {
            IV.set(id, !IV.get(id));
        });
    }
}, "unique");
// data-popup
IV.registerObjectType("span[data-popup]", function() {
    var key = $(this).attr("data-popup");
    $(this).click(function() {
        var data = IV.popups[key]();
        data.show($(this));
    });
}, "unique");
// data-href
IV.registerObjectType("span[data-open-page]", function() {
    var href = $(this).attr("data-open-page");
    var title = $(this).attr("data-open-page-title");
    $(this).click(function() {
        $("#panel-page").IVPanel("show");
        $("#panel-page").IVPanel("front");
        if(title) {
            $("#panel-page").IVPanel({ title: title });
        }
        if(href[0] == "#") {
            $("#panel-page-container").html($(href).html());
        } else {
            if(href.substr(0, 7) == "base64:") {
                var ht = atob(href.substr(7));
                $("#panel-page-container").html(ht);
            } else {
                $("#panel-page-container").load(href);
            }
        }
    });
}, "unique");
// data-command
IV.registerObjectType("span[data-command]", function() {
    var command = $(this).attr("data-command");
    $(this).click(function() {
        IV.raiseEvent("command:" + command, $(this).attr("data-parameters"));
    });
}, "unique");
