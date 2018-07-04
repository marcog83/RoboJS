/**
 * Created by marco.gobbi on 21/01/2015.
 */
import {EventTarget} from "../../events/impl/EventTarget";


export class AHandler {

    constructor(params) {
        let {definitions = {}, dispatcher = new EventTarget()} = params;
        this.definitions = definitions;
        this.dispatcher = dispatcher;
    }

    getDefinition(node) {
        throw new Error("not implemented");
    }

    inCache(node) {
        throw new Error("not implemented");
    }

    updateCache(disposable) {
        throw new Error("not implemented");

    }

    hasMediator(node) {
        return false;
    }


    create(node, Mediator) {
        throw new Error("not implemented");
    }

    getAllElements(node) {
        throw new Error("not implemented");
    }


    /**
     *
     * @param node
     */

    destroy(node) {

    }

    dispose() {


    }
}


