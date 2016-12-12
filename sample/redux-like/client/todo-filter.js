/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    var rjs = require("robojs");
    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new rjs.RJSEvent(Actions.SET_VISIBILITY_FILTER, node.value));
        }


        node.addEventListener("change", handler);
        return function () {
            node.removeEventListener("change", handler);
        }
    };
});