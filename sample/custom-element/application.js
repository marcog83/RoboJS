/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";

    var rjs = require("robojs");
    var definitions = require("./client/definitions");

    function Application() {

        rjs.bootstrap({
            definitions: definitions,
            loader: rjs.Loader(),
            handler:rjs.CustomElementHandler({definitions:definitions})
        }).promise.catch(function (e) {
            console.log(e);
        })


    }


    return Application;
});