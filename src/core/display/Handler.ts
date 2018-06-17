/**
 * Created by marco.gobbi on 21/01/2015.
 */
import EventTarget from "../events/EventTarget";


export default class Handler {
    definitions:{};
    dispatcher:EventTarget;
    constructor(params){
        let {definitions = {}, dispatcher = new EventTarget()} = params;
        this.definitions = definitions;
        this.dispatcher = dispatcher;
    }
    /**
     *
     * @param node
     * @return {*}
     */

    getDefinition(node) {

    }

    /**
     *
     * @param node
     * @return {boolean}
     */
    inCache(node) {
        return false;
    }

    /**
     *
     * @param disposable
     */
    updateCache(disposable) {


    }

    /**
     *
     * @param {HTMLElement} node
     * @return {boolean}
     */
    hasMediator(node) {
        return false;
    }

    /**
     *
     * @param load
     * @param node
     * @return {Promise.<TResult>}
     */
    findMediator(load, node) {
        return load(this.getDefinition(node))
            .then(Mediator => this.create(node, Mediator))
            .then(this.updateCache.bind(this));
    }

    /**
     *
     * @param node
     * @param Mediator
     * @return {*}
     */
    create(node, Mediator) {
        throw new Error("not implemented");
    }

    /**
     *
     * @param node
     * @return {Array.<TResult>}
     */
    getAllElements(node) {

    }


    /**
     *
     * @param node
     */

    destroy(node:HTMLElement) {

    }

    dispose() {


    }
}


