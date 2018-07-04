import {Signal} from "../../events/impl/Signal";


import {flatten, unique} from "../../internal/index";


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

    getAdded(addedNodes) {
        let nodes = flatten(addedNodes);
        nodes = nodes.filter(node => node.querySelectorAll)
            .map(this.handler.getAllElements.bind(this.handler))
            .filter(nodes => nodes.length > 0);
        nodes = flatten(nodes);
        nodes = unique(nodes);
        if (nodes.length > 0) {
            this.onAdded.emit(nodes);
        }
    }

    getRemoved(removedNodes) {
        let nodes = flatten(removedNodes);
        nodes = nodes.filter(node => node.querySelectorAll)
            .map(this.handler.getAllElements.bind(this.handler))
            .filter(nodes => nodes.length > 0);
        nodes = flatten(nodes);
        nodes = unique(nodes);
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


