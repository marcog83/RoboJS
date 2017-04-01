import Signal from "../events/signal";


import makeChain from "./make-chain";
export default  (root = document.body) => {
    let onAdded = Signal();
    let onRemoved = Signal();

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


