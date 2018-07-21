/**
 * Created by marcogobbi on 07/05/2017.
 */

import {AHandler} from "./AHandler";
import {Disposable} from "./Disposable";



export class CustomElementHandler extends AHandler {


    constructor(params) {
        super(params);
        this.REGISTERED_ELEMENTS = {};

    }

    updateCache(id) {
        this.REGISTERED_ELEMENTS[id] = true;
        return this.REGISTERED_ELEMENTS;
    }

    inCache(id) {
        return !!this.REGISTERED_ELEMENTS[id];
    }

    getDefinition(node) {
        return this.definitions[node.tagName.toLowerCase()];
    }

    create(node, Mediator) {
        let tagName = "";
        let dispatcher = this.dispatcher;
        if (!this.inCache(node.tagName.toLowerCase())) {
            tagName = node.tagName.toLowerCase();
            if (!tagName.match(/-/gim)) {
                throw new Error("The name of a custom element must contain a dash (-). So <x-tags>, <my-element>, and <my-awesome-app> are all valid names, while <tabs> and <foo_bar> are not.");
            }
            window.customElements.define(tagName, class extends Mediator {
                constructor() {
                    super(dispatcher);
                }
            });

            this.updateCache(tagName);
        }
        return new Disposable();
    }

    hasMediator(node) {
        let id = node.tagName.toLowerCase();
        return !!this.getDefinition(node) && !this.inCache(id);
    }

    getAllElements(node) {
        const _children = Array.from(node.querySelectorAll("*")).filter(function (el) {
            return el.tagName.match(/-/gim);
        });
        let root=[];
        if(node.tagName.match(/-/gim)){
            root=[node];
        }
        return root.concat(_children);
    }

}
