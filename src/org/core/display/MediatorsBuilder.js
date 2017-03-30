import map from "ramda/src/map";

import forEach from "ramda/src/forEach";
import flatten from "ramda/src/flatten";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";
export default function (domWatcher, loader, handler, definitions) {


    let _handleNodesRemoved = compose(
        forEach(handler.destroy),
        flatten
    );


    let getMediators = compose(
        promises => Promise.all(promises)
        , map(handler.findMediators(definitions, loader)),
        filter(handler.hasMediator(definitions)),
        flatten
    );


    domWatcher.onAdded.connect(getMediators);
    domWatcher.onRemoved.connect(_handleNodesRemoved);

    let bootstrap = compose(
        getMediators,
        map(handler.getAllElements),
        (root = document.body) => [root]
    );

    function dispose() {
        domWatcher.dispose();
        handler.dispose();
    }

    return Object.freeze({bootstrap, dispose})

}


