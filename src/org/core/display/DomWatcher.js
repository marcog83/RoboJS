import Signal from "../events/Signal";

import map from "ramda/src/map";
import flatten from "ramda/src/flatten";
import pluck from "ramda/src/pluck";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";

export default  (getAllElements, root = document.body)=> {
    var onAdded = Signal();
    var onRemoved = Signal();

    function makeChain(prop, emit) {
        return compose(
            emit,
            filter(nodes=>nodes.length>0),
            map(getAllElements),
            filter(node=>node.querySelectorAll),
            flatten,
            pluck(prop)//"addedNodes","removedNodes"
        )

    }

    var getAdded = makeChain("addedNodes", onAdded.emit);
    var getRemoved = makeChain("removedNodes", onRemoved.emit);

    var handleMutations = mutations=> {

        getAdded(mutations);
        getRemoved(mutations);
       var attributesChanged= mutations
            .filter(mutation=>{
                return mutation.type=="attributes"
                    && mutation.attributeName=="mediatorid"
                    && mutation.target.getAttribute("mediatorid") == null
            })
            .map(mutation=>mutation.target);
        onRemoved.emit(attributesChanged);
        onAdded.emit(attributesChanged);
            //.forEach(onRemoved.emit)
    };
    var observer = new MutationObserver(handleMutations);
    /* <h3>Configuration of the observer.</h3>
     <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
     */
    observer.observe(root, {
        attributes: true,
        childList: true,
        characterData: false,
        subtree: true
    });
    function dispose(){
        observer.disconnect();
        onAdded.disconnectAll();
        onRemoved.disconnectAll();
    }
    return Object.freeze({onAdded, onRemoved,dispose})
};


