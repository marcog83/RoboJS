import {Signal} from "../events/Signal";


import flatten from "../internal/_flatten";
import unique from "../internal/_unique";


export class DomWatcher {

    constructor(root, handler) {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        this.root = root;
        this.handler = handler;
        this.init();
    }

    init() {
        this.observer = new MutationObserver(this.handleMutations.bind(this));
        this.observer.observe(this.root, {
            attributes: false,//true
            childList: true,
            characterData: false,
            subtree: true
        });
    }

    handleMutations(mutations) {
        mutations.forEach(mutation => {
            this.getRemoved(mutation.removedNodes);
            this.getAdded(mutation.addedNodes);
        });


    }

    _parseNodes(nodes) {
         nodes = flatten(nodes);
        nodes = nodes.filter(node => node.querySelectorAll)
            .map(this.handler.getAllElements.bind(this.handler))
            .filter(nodes => nodes.length > 0);
        nodes = flatten(nodes);
        nodes = unique(nodes);
        return nodes;
    }

    getAdded(addedNodes) {
        const nodes = this._parseNodes(addedNodes);
        if (nodes.length > 0) {
            this.onAdded.emit(nodes);
        }
    }

    getRemoved(removedNodes) {
        const nodes = this._parseNodes(removedNodes);
        if (nodes.length > 0) {
            this.onRemoved.emit(nodes);
        }
    }

    dispose() {
        this.observer.disconnect();
        this.onAdded.disconnectAll();
        this.onRemoved.disconnectAll();
        this.observer = null;
        this.onAdded = null;
        this.onRemoved = null;

    }

}


