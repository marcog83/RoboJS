import Signal from "../events/Signal";
import tap from "ramda/src/tap";
import map from "ramda/src/map";
import flatten from "ramda/src/flatten";
import pluck from "ramda/src/pluck";
import compose from "ramda/src/compose";

export default  (root=document.body)=> {
    var onAdded = Signal();

    function makeChain(prop, emit) {
        return compose(
            tap(nodes=>(nodes.length && emit(nodes))),//onAdded.emit,onRemoved.emit
            map(node=>[node].concat(Array.prototype.slice.call(node.getElementsByTagName("*"), 0))),
            flatten(),
            pluck(prop)//"addedNodes","removedNodes"
        )

    }

    var observer = new MutationObserver(makeChain("addedNodes", onAdded.emit));

    /* <h3>Configuration of the observer.</h3>
     <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
     */
    observer.observe(root, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    return Object.freeze({onAdded})
};


