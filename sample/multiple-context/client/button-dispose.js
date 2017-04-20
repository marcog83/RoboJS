/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {

    return function (node, dispatcher) {
        function handler() {
            dispatcher.dispatchEvent(new Event("dispose-component"));
        }
        node.addEventListener("click", handler);
        return function () {
            node.removeEventListener("click", handler);
        }
    };
});