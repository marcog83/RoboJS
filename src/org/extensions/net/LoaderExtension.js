define(["robojs"], function (RoboJS) {
    'use strict';
    var LoaderExtension = {
        extend: function (context) {
            this.injector = context.injector;

            // how to load external scripts
            this.injector.map(RoboJS.net.ScriptLoader, 'ScriptLoader');


        }
    };
    return LoaderExtension;
});