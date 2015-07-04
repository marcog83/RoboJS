import Signal from "../events/Signal";
import R from "ramda";
export default function DomWatcher() {
    var onAdded = Signal();
    var onRemoved = Signal();

    function makeChain(prop, emit) {
        return R.compose(
            R.tap(nodes=>(nodes.length && emit(nodes))),//onAdded.emit,onRemoved.emit
            R.map(node=>[node].concat([].slice.call(node.querySelectorAll("[data-mediator]"), 0))),
            R.filter(node=>node.querySelectorAll),
            R.flatten(),
            R.pluck(prop)//"addedNodes","removedNodes"
        )

    }

    var getAdded = makeChain("addedNodes", onAdded.emit);
    var getRemoved = makeChain("removedNodes", onRemoved.emit);

    var handleMutations = mutations=> {
        getAdded(mutations);
        getRemoved(mutations);

    };
    var observer = new MutationObserver(handleMutations);

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
        onAdded,
        onRemoved
    }
};


