import Signal from "../events/Signal";

import map from "ramda/src/map";
import flatten from "ramda/src/flatten";
import pluck from "ramda/src/pluck";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";

export default  (getAllElements, root = document.body) => {
    let onAdded = Signal();
    let onRemoved = Signal();

    function makeChain(prop, emit) {
        return compose(
            nodes => {
                if (nodes.length > 0) {
                    emit(nodes);
                }
            },
            filter(nodes => nodes.length > 0),
            map(getAllElements),
            filter(node => node.querySelectorAll),
            flatten,
            pluck(prop)//"addedNodes","removedNodes"
        )

    }

    let getAdded = makeChain("addedNodes", onAdded.emit);
    let getRemoved = makeChain("removedNodes", onRemoved.emit);

    let handleMutations = mutations => {

        getRemoved(mutations);
        getAdded(mutations);

    };
    let observer = new MutationObserver(handleMutations);
    /* <h3>Configuration of the observer.</h3>
     <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
     */
    observer.observe(root, {
        attributes: false,//true
        childList: true,
        characterData: false,
        subtree: true
    });
    function dispose() {
        observer.disconnect();
        onAdded.disconnectAll();
        onRemoved.disconnectAll();
    }

    return Object.freeze({onAdded, onRemoved, dispose})
};


