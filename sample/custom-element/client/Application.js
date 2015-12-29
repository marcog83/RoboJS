/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";
    var rjs = require("robojs");
    var definitions = require("./definitions");

    function Application() {
        /**
         *
         * @type {function}
         * bootstrap is a sugar function to hide internal dependencies.
         * A MediatorsBuilder is created.
         * MediatorsBuilder will iterate the DOM trying to match definitions keys with custom elements tag name.
         * @return {Promise}.
         * Promise is meant to be resolved when every mediators are loaded.
         *
         */
        rjs.bootstrap({
            definitions: definitions,
            loader: rjs.AMDScriptLoader,
            mediatorHandler:rjs.CustomElementHandler()
        }).catch(function (e) {
            console.log(e);
        })


    }

    !function setHandlers() {
        document.querySelector(".add-button").addEventListener("click", function handler() {
            var element = document.createElement("div");
            element.innerHTML = "<foo-element>foo! <bar-element>bar!</bar-element></foo-element>";//.clone();
            document.body.appendChild(element.firstElementChild);
        });

    }();

    return Application();
});