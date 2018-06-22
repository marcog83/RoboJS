/**
 * Created by marco.gobbi on 21/01/2015.
 */
import EventTarget from "../../events/EventTarget";
import IHandler from "../api/IHandler";
import IDisposable from "../api/IDisposable";


export default class Handler implements IHandler{
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
     * @param node
     * @param Mediator
     * @return {IDisposable}
     */
    create(node, Mediator):IDisposable {
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


