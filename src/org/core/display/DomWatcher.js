import Signal from "../events/Signal";
import R from "ramda";
export default function DomWatcher() {
    var onAdded = Signal();

    function makeChain(prop, emit) {
        return R.compose(
            R.tap(nodes=>(nodes.length && emit(nodes))),//onAdded.emit,onRemoved.emit
            R.map(node=>[node].concat([].slice.call(node.getElementsByTagName("*"), 0))),
            R.flatten(),
            R.pluck(prop)//"addedNodes","removedNodes"
        )

    }

    var observer = new MutationObserver(makeChain("addedNodes", onAdded.emit));

    /* <h3>Configuration of the observer.</h3>
     <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
     */
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    return {
        onAdded
    }
};


