/**
 * Created by marco.gobbi on 07/01/2015.
 */
define(["Promise"], function (Promise) {
    "use strict";

    function ScriptLoader() {
    }

    ScriptLoader.prototype = {
        get: function (id) {
            return new Promise(function (resolve, reject) {
                require([id], function (Mediator) {
                    resolve(Mediator);
                });
            });
        }
    };
    return ScriptLoader;
});