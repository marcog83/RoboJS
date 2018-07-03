/**
 * Created by marco.gobbi on 21/01/2015.
 */


import noop from "../../internal/_noop";
import {nextUid} from "./next-uid";
import {AHandler} from "./AHandler";
import {IDisposable, Disposable} from "../api/IDisposable";
import {EventTarget} from "../../events/impl/EventTarget";


export class MediatorHandler extends AHandler {
    MEDIATORS_CACHE: Array<IDisposable>;
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
        return !!this.MEDIATORS_CACHE.find((disposable: IDisposable) => disposable.node === node);
    }

    updateCache(disposable: IDisposable) {
        this.MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
        return this.MEDIATORS_CACHE;
    }

    hasMediator(node: HTMLElement) {
        return !!this.getDefinition(node) && !this.inCache(node);
    }


    create(node: HTMLElement, Mediator: any): IDisposable {
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

    getAllElements(node: HTMLElement): Array<Element> {
        const nodes = Array.from(node.querySelectorAll(`[${this.selector}]`)).slice(0);
        if (node.getAttribute(this.selector)) {
            nodes.unshift(node);
        }
        return nodes;
    }

    static disposeMediator(disposable: IDisposable) {
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


