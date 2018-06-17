/**
 * Created by marco.gobbi on 21/01/2015.
 */


import {find, noop} from "../../internal";
import nextUid from "./next-uid";
import Handler from "./Handler";


interface Disposable {
    mediatorId: string,
    node: HTMLElement,
    dispose: () => void
}

export default class MediatorHandler extends Handler {
    MEDIATORS_CACHE: Array<Disposable>;
    definitions: Object;
    dispatcher: EventTarget;

    constructor(params = {}) {
        super(params);

        this.MEDIATORS_CACHE = [];
    }

    get selector() {
        return "data-mediator";
    }


    getDefinition(node: HTMLElement) {
        return this.definitions[node.getAttribute(this.selector)];
    }

    inCache(node: HTMLElement) {
        return !!this.MEDIATORS_CACHE.find((disposable: Disposable) => disposable.node === node);
    }

    updateCache(disposable: Disposable) {
        this.MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
        return this.MEDIATORS_CACHE;
    }

    hasMediator(node: HTMLElement) {
        return !!this.getDefinition(node) && !this.inCache(node);
    }


    findMediator(load, node: HTMLElement) {
        return load(this.getDefinition(node))
            .then(Mediator => this.create(node, Mediator))
            .then(this.updateCache.bind(this));
    }

    create(node, Mediator) {
        const mediatorId = nextUid();
        node.setAttribute("mediatorid", mediatorId);
        let disposable = {
            mediatorId,
            node,
            dispose: noop
        };
        if (node.parentNode) {

            const dispose = Mediator(node, this.dispatcher) || noop;
            disposable = {
                mediatorId,
                node,
                dispose
            };
        }
        return disposable;
    }

    getAllElements(node: HTMLElement) {
        const nodes = [].slice.call(node.querySelectorAll("[" + this.selector + "]"), 0);
        if (node.getAttribute(this.selector)) {
            nodes.unshift(node);
        }
        return nodes;
    }

    static disposeMediator(disposable: Disposable) {
        if (disposable) {
            disposable.dispose();
            disposable.node = null;
        }
    }

    _destroy(node: HTMLElement) {
        const l = this.MEDIATORS_CACHE.length;
        for (let i = 0; i < l; i++) {
            let disposable = this.MEDIATORS_CACHE[i];
            if (disposable) {
                if (!disposable.node || disposable.node === node) {
                    disposable.dispose && disposable.dispose();
                    disposable.node = null;
                    this.MEDIATORS_CACHE[i] = null;

                }

            } else {

                this.MEDIATORS_CACHE[i] = null;

            }

        }

        return this.MEDIATORS_CACHE.filter(i => i);
    }

    destroy(node: HTMLElement) {
        this.MEDIATORS_CACHE = this._destroy(node);
        return this.MEDIATORS_CACHE;
    }

    dispose() {
        this.MEDIATORS_CACHE.forEach(MediatorHandler.disposeMediator);
        this.MEDIATORS_CACHE = null;
        //  this.dispatcher.listeners_ = null;
        this.dispatcher = null;

    }
}


