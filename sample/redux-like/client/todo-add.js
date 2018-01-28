/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    return function (node, dispatcher) {
        var input = node.querySelector("input");
        var button = node.querySelector("button");
        button.addEventListener("click", function (e) {
            dispatcher.dispatchEvent(new CustomEvent(Actions.ADD_TODO, {detail: input.value}));
        })
    };
});