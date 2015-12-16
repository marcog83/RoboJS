import map from "ramda/src/map";

import forEach from "ramda/src/forEach";
import flatten from "ramda/src/flatten";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";
export default function (domWatcher, loader, mediatorHandler, definitions) {


    var _handleNodesRemoved = compose(
        forEach(mediatorHandler.destroy),
        flatten()
    );


    var findMediators = definitions=>node=> loader.load(definitions[node.getAttribute("data-mediator")]).then(mediatorHandler.create(node));

    var hasMediator = definitions=>node=>(definitions[node.getAttribute("data-mediator")] && !node.getAttribute("mediatorid"));


    var getMediators = compose(
        function(promises){

            return Promise.all(promises)
        },
        map(findMediators(definitions)),
        filter(hasMediator(definitions)),
        flatten()
    );


    domWatcher.onAdded.connect(getMediators);
    domWatcher.onRemoved.connect(_handleNodesRemoved);

    var bootstrap = compose(
        getMediators,
        map(node=>[node].concat([].slice.call(node.querySelectorAll("[data-mediator]"), 0))),
        (root = document.body)=> [root]
    );

    return Object.freeze({bootstrap})

}


