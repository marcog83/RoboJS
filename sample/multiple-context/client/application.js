/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";
    var rjs = require("robojs");
    var definitions = {
        "search-map": "client/search-map"

    };


    return function () {
        rjs.bootstrap({
            definitions: definitions,
            loader: rjs.AMDScriptLoader()
        }).promise.catch(function (e) {
            console.log(e);
        });

    };
});