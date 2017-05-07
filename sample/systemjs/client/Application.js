/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";
    var rjs = require("robojs");
    var definitions = require("./definitions");

    function loaderFn(id, resolve, reject) {
        return System.import(id).then(resolve).catch(reject)
    }

    function Application() {

       var application= rjs.bootstrap({
            definitions: definitions
            , loader: rjs.Loader(loaderFn)
        });
        function handler() {
            var element = document.createElement("div");
            element.innerHTML = "<div data-mediator='foo-element'>foo! <div data-mediator='bar-element'>bar!</div></div>";//.clone();
            document.body.appendChild(element.firstElementChild);
        }
        function dispose() {
            application.dispose();
        }
        document.querySelector(".add-button").addEventListener("click",handler);
        document.querySelector(".dispose-button").addEventListener("click",dispose );

    }



    return Application();
});