//. iVisDesigner - File: scripts/editor/tools/text.js
//. Copyright 2013-2014 Donghao Ren
//. Peking University, University of California, Santa Barbara
//. See LICENSE.md for more information.

// iVisDesigner
// Author: Donghao Ren, PKUVIS, Peking University, 2013.04
// See LICENSE.txt for copyright information.

(function() {

Tools.Text = {
    onActive: function() {
        var $this = this;
        IV.set("status", "Text: Select the anchor.");
        Tools.beginSelectLocation(function(loc) {
            var path = Editor.get("selected-path");
            if(path) {
                var text = new IV.objects.Text({
                    path: path,
                    anchor: loc
                });
                Editor.doAddObject(text);
            }
        }, "tools:Text");
    },
    onInactive: function() {
        Tools.endSelectLocation("tools:Text");
    }
};

})();
