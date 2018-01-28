/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new CustomEvent(Actions.TOGGLE_TODO, {detail: index}));
        }

        var index = parseInt(node.dataset.index);
        node.addEventListener("click", handler);
        return function () {
            node.removeEventListener("click", handler);
        }
    };
});