/**
 * Created by marco.gobbi on 21/01/2015.
 */

import {makeDispatcher} from "../events/EventDispatcher";
import find from "ramda/src/find";
import filter from "ramda/src/filter";
const noop = () => {
};
const nextUid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = Math.random() * 16 | 0;
    let v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});
export default  function (params = {}) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    const {selector = "data-mediator", dispatcher = makeDispatcher()} = params;
    //inizializza la cache dei mediatori registrati
    let MEDIATORS_CACHE = [];

//
    /**
     *
     * @param node {HTMLElement}
     * crea un nuovo mediator passandogli l'elemento HTML
     * @returns {Function}
     */
    function create(node) {
        /**
         * @param Mediator{Function}
         *
         * � la funzione costruttrice per ogni mediator
         */
        return function (Mediator) {
            const mediatorId = nextUid();

            node.setAttribute('mediatorid', mediatorId);

            const dispose = Mediator(node, dispatcher) || noop;
            const disposable = {
                mediatorId,
                node,
                dispose
            };
            MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;

            return disposable;

        }
    }

    /**
     *
     * @param node {HTMLElement} l'elemento rimosso dal DOM
     * @returns void;
     */
    function destroy(node) {
        for (let i = 0; i < MEDIATORS_CACHE.length; i++) {
            let disposable = MEDIATORS_CACHE[i];
            if (disposable && disposable.node === node) {
                disposable.dispose();
                disposable.node = null;
                MEDIATORS_CACHE[i] = null;

            }
        }

        MEDIATORS_CACHE = MEDIATORS_CACHE.filter(m => m);
    }

    function dispose() {
        MEDIATORS_CACHE.forEach(function (disposable) {
            if (disposable) {
                disposable.dispose();
                disposable.node = null;

            }
        });
        MEDIATORS_CACHE = [];
        dispatcher.removeAllEventListeners();
    }


    const findMediators = (definitions, loader) =>
        node =>
            loader.load(definitions[node.getAttribute(selector)]).then(create(node));

    const inCache = node => {
        const disposable = find(disposable => disposable.node === node, MEDIATORS_CACHE);
        return !!disposable
    };
    const hasMediator = definitions =>
        node => (definitions[node.getAttribute(selector)] && !inCache(node));
    const getAllElements = node =>
        [node].concat([].slice.call(node.querySelectorAll("[" + selector + "]"), 0));

    return Object.freeze({
        dispose,
        destroy,
        findMediators,
        hasMediator,
        getAllElements

    })
};