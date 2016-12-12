/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    var rjs = require("robojs");
    return function (node, dispatcher) {
        var input = node.querySelector("input");
        var button = node.querySelector("button");
        button.addEventListener("click", function (e) {
            dispatcher.dispatchEvent(new rjs.RJSEvent(Actions.ADD_TODO, input.value));
        })
    };
});