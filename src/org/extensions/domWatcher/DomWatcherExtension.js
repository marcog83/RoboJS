define(["RoboJS"], function (RoboJS) {
    'use strict';
    var DomWatcherExtension = {
        extend: function (context) {
            this.injector = context.injector;
            // how to handle DOM changes
            this.injector.map(RoboJS.display.DisplayList, 'DisplayList');

        }
    };
    return DomWatcherExtension;
});