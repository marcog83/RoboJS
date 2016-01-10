import map from "ramda/src/map";

import forEach from "ramda/src/forEach";
import flatten from "ramda/src/flatten";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";
export default function (DomWatcher, loader, handler, definitions) {
    var domWatcher = DomWatcher(handler.getAllElements);

    var _handleNodesRemoved = compose(
        forEach(handler.destroy),
        flatten()
    );


    var getMediators = compose(
        function (promises) {
            return Promise.all(promises)
        },
        map(handler.findMediators(definitions, loader)),
        filter(handler.hasMediator(definitions)),
        flatten()
    );


    domWatcher.onAdded.connect(getMediators);
    domWatcher.onRemoved.connect(_handleNodesRemoved);

    var bootstrap = compose(
        getMediators,
        map(handler.getAllElements),
        (root = document.body)=> [root]
    );

    return Object.freeze({bootstrap})

}


