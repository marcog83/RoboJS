/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";
    var rjs = require("robojs");
    var definitions = require("./definitions");

    function Application() {

        rjs.bootstrap({
            definitions: definitions

        }).promise.catch(function(e){
            console.log(e);
        })


    }

    !function setHandlers() {
        document.querySelector(".add-button").addEventListener("click", function handler() {
            var element = document.createElement("div");
            element.innerHTML = "<div data-mediator='foo-element'>foo! <div data-mediator='bar-element'>bar!</div></div>";//.clone();
            document.body.appendChild(element.firstElementChild);
        });

    }();

    return  Application();
});