import Signal from "../events/signal";


import makeChain from "./make-chain";
export default  (root,getAllElements) => {
    let onAdded =new  Signal();
    let onRemoved = new Signal();

    let getAdded = makeChain("addedNodes",getAllElements, onAdded.emit.bind(onAdded));
    let getRemoved = makeChain("removedNodes",getAllElements, onRemoved.emit.bind(onRemoved));

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
        observer=null;
        onAdded=null;
        onRemoved=null;
        getAdded=null;
        getRemoved=null;
    }

    return Object.freeze({onAdded, onRemoved, dispose})
};


