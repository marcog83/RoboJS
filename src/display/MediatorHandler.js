/**
 * Created by marco.gobbi on 21/01/2015.
 */


import noop from "../internal/_noop";
import {nextUid} from "./next-uid";
import {AHandler} from "./AHandler";
import {Disposable} from "./Disposable";


export class MediatorHandler extends AHandler {

    constructor(params) {
        super(params);

        this.MEDIATORS_CACHE = [];
    }

    get selector() {
        return "data-mediator";
    }


    getDefinition(node) {
        return this.definitions[node.getAttribute(this.selector)];
    }

    inCache(node) {
        return !!this.MEDIATORS_CACHE.find((disposable) => disposable.node === node);
    }

    updateCache(disposable) {
        this.MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
        return this.MEDIATORS_CACHE;
    }

    hasMediator(node) {
        return !!this.getDefinition(node) && !this.inCache(node);
    }


    create(node, Mediator) {

        const mediatorId = nextUid();
        node.setAttribute("mediatorid", mediatorId);
        let dispose = noop;

        if (node.parentNode) {
            dispose = Mediator(node, this.dispatcher) || noop;
        }
        let disposable = new Disposable({
            mediatorId,
            node,
            dispose
        });
        this.updateCache(disposable);
        return disposable;
    }

    getAllElements(node) {
        const nodes = Array.from(node.querySelectorAll(`[${this.selector}]`)).slice(0);
        if (node.getAttribute(this.selector)) {
            nodes.unshift(node);
        }
        return nodes;
    }

    static disposeMediator(disposable) {
        disposable.dispose();
        disposable.node = null;
    }

    _destroy(node) {
        const l = this.MEDIATORS_CACHE.length;

        for (let i = 0; i < l; i++) {
            let disposable = this.MEDIATORS_CACHE[i];
            if (disposable && (!disposable.node || disposable.node === node)) {
                MediatorHandler.disposeMediator(disposable);
                this.MEDIATORS_CACHE[i] = null;

            }

        }

        return this.MEDIATORS_CACHE.filter(i => i);
    }

    destroy(node) {
        this.MEDIATORS_CACHE = this._destroy(node);
        return this.MEDIATORS_CACHE;
    }

    dispose() {
        this.MEDIATORS_CACHE.forEach(MediatorHandler.disposeMediator);
        this.MEDIATORS_CACHE = null;

        this.dispatcher = null;

    }
}


