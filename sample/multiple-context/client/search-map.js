/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require) {
    var rjs = require("robojs");


    return function (node, dispatcher) {
        var definitions = {
            "autocomplete-bar": "client/autocomplete-bar"
            , "map-panel": "client/map-panel"
            , "button-dispose": "client/button-dispose"
        };
        // create a new EventDispatcher for each search-map component.
        // By default a new instance of EventDispatcher is created when MediatorHandler is invoked.
        // In this case we need a reference of dispatcher which listen to 'dispose-component' event.
        var componentDispatcher = rjs.makeDispatcher();
        var robojs = rjs.bootstrap({

             handler: rjs.MediatorHandler({definitions:definitions,dispatcher: componentDispatcher})
            , root: node
        });
        componentDispatcher.addEventListener("dispose-component", function () {
            node.parentNode.removeChild(node);
        });
        return function () {
            console.log("DISPOSE");
            robojs.dispose();
        }
    }
});