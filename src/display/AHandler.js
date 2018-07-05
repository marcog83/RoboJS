/**
 * Created by marco.gobbi on 21/01/2015.
 */
import {EventTarget} from "../events/EventTarget";


export class AHandler {

    constructor(params) {
        let {definitions = {}, dispatcher = new EventTarget()} = params;
        this.definitions = definitions;
        this.dispatcher = dispatcher;
    }

    getDefinition() {
        throw new Error("not implemented");
    }

    inCache() {
        throw new Error("not implemented");
    }

    updateCache() {
        throw new Error("not implemented");

    }

    hasMediator() {
        return false;
    }


    create() {
        throw new Error("not implemented");
    }

    getAllElements() {
        throw new Error("not implemented");
    }

    destroy() {

    }

    dispose() {


    }
}


