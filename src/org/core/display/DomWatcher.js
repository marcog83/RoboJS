import Signal from "../events/Signal";
import R from "ramda";
export default function DomWatcher() {
    let onAdded = Signal();
    let onRemoved = Signal();

    function makeChain(prop, emit) {
        return R.compose(
            R.tap(nodes=>(nodes.length && emit(nodes))),//onAdded.emit,onRemoved.emit
            R.map(node=>[node].concat([].slice.call(node.getElementsByTagName("*"), 0))),
            R.filter(node=>node.getElementsByTagName),
            R.flatten(),
            R.pluck(prop)//"addedNodes","removedNodes"
        )

    }

    let getAdded = makeChain("addedNodes", onAdded.emit);
    let getRemoved = makeChain("removedNodes", onRemoved.emit);

    let handleMutations = mutations=> {
        getAdded(mutations);
        getRemoved(mutations);

    };
    let observer = new MutationObserver(handleMutations);

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


