/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new CustomEvent(Actions.SET_VISIBILITY_FILTER,{detail: node.value}));
        }


        node.addEventListener("change", handler);
        return function () {
            node.removeEventListener("change", handler);
        }
    };
});