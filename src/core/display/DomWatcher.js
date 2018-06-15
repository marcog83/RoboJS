import Signal from "../events/Signal";


import {flatten, unique} from "../../internal/index";


/**
 *
 * @param root {HTMLElement}
 * @param getAllElements {Handler_getAllElements}
 * @return {DomWatcher}
 */

export default class DomWatcher {
    constructor(root, getAllElements) {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        this.root = root;
        this.getAllElements = getAllElements;
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
        mutations.forEach(mutation=>{
            this.getRemoved(mutation.removedNodes);
            this.getAdded(mutation.addedNodes);
        });


    }

    getAdded(addedNodes) {
        let nodes = flatten(addedNodes);
        nodes = nodes.filter(node => node.querySelectorAll)
            .map(this.getAllElements)
            .filter(nodes => nodes.length > 0);
        nodes = flatten(nodes);
        nodes = unique(nodes);
        if (nodes.length > 0) {
            return this.onAdded.emit(nodes);
        } else {
            return [];
        }
    }

    getRemoved(removedNodes) {
        let nodes = flatten(removedNodes);
        nodes = nodes.filter(node => node.querySelectorAll)
            .map(this.getAllElements)
            .filter(nodes => nodes.length > 0);
        nodes = flatten(nodes);
        nodes = unique(nodes);
        if (nodes.length > 0) {
            return this.onRemoved.emit(nodes);
        } else {
            return [];
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


