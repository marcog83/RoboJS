/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    var rjs = require("robojs");
    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new rjs.RJSEvent(Actions.TOGGLE_TODO, index));
        }

        var index = parseInt(node.dataset.index);
        node.addEventListener("click", handler);
        return function () {
            node.removeEventListener("click", handler);
        }
    };
});