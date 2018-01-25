/**
 * Created by mgobbi on 11/05/2017.
 */
import {curry, find, noop} from "../internal";
import {makeDispatcher} from "../core";
import nextUid from "../core/display/next-uid";

export default class MediatorClassHandler {
    constructor(params) {
        this.definitions = params.definitions;
        this.dispatcher = params.dispatcher || makeDispatcher();
        this.VIEW_CACHE = [];
        this.findMediator = curry((load, node) => {
            return load(this.getDefinition(node))
                .then(this.createView(node))
                .then(this.updateCache);
        });
        // this.hasMediator =;
        //this.updateCache =;
        // this.destroy =
        //this.


    }

    hasMediator(node) {
        return !find(disposable => disposable.node === node, this.VIEW_CACHE)
    }

    updateCache(disposable) {
        this.VIEW_CACHE.push(disposable);
        return this.VIEW_CACHE;
    }

    destroy(node) {
        for (let i = 0; i < this.VIEW_CACHE.length; i++) {
            let disposable = this.VIEW_CACHE[i];
            if (disposable && disposable.node === node) {
                disposable.dispose();
                disposable.node = null;
                this.VIEW_CACHE[i] = null;
                this.VIEW_CACHE.splice(i, 1);
            }
        }
        return this.VIEW_CACHE;
    }

    dispose() {
        this.VIEW_CACHE.forEach(disposable => {
            if (disposable) {
                disposable.dispose();
                disposable.node = null;
            }
        });
        this.dispatcher.removeAllEventListeners();
        this.VIEW_CACHE = null;
        this.dispatcher = null;
        this.definitions = null;

    }


    getDefinition(node) {
        return this.definitions[node.dataset.mediator];
    }


    createView(node) {
        return ViewClass => {
            const mediatorId = this.nextUid();
            node.setAttribute('idmediator', mediatorId);
            var view = new ViewClass(node, this.dispatcher);
            return {
                node,
                dispose: view.dispose || noop
            }
        }
    }


    getAllElements(node) {
        var nodes = [].slice.call(node.querySelectorAll("[data-mediator]"), 0);
        if (node.hasAttribute("data-mediator")) {
            nodes.unshift(node);
        }

        return nodes;
    }

    nextUid() {
        return nextUid();
    }

}