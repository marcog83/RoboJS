/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var rjs = require("robojs");
    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new rjs.RJSEvent("dispose-component"));
        }
        node.addEventListener("click", handler);
        return function () {
            node.removeEventListener("click", handler);
        }
    };
});