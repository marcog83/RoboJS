/**
 * Created by marco.gobbi on 21/01/2015.
 */
import {EventTarget} from "../events/EventTarget";


export class AHandler {

    constructor(params) {
        let {definitions , dispatcher = new EventTarget()} = params;
        this.definitions = definitions;
        this.dispatcher = dispatcher;
    }

    getDefinition() {
        // do nothing.
    }

    inCache() {
        // do nothing.
    }

    updateCache() {
        // do nothing.

    }

    hasMediator() {
        // do nothing.
    }


    create() {
        // do nothing.
    }

    getAllElements() {
        // do nothing.
    }

    destroy() {
        // do nothing.
    }

    dispose() {
        // do nothing.

    }
}


