/**
 * Created by marco.gobbi on 21/01/2015.
 */

import {makeDispatcher} from "../events/EventDispatcher";
import find from "ramda/src/find";
import filter from "ramda/src/filter";
const noop = ()=> {
};
const nextUid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});
export default  function () {

    //inizializza la cache dei mediatori registrati
    var MEDIATORS_CACHE = [];
    //crea un'istanza dell'EventDispatcher
    const eventDispatcher = makeDispatcher();
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
         * è la funzione costruttrice per ogni mediator
         */
        return function (Mediator) {
            const mediatorId = nextUid();

            node.setAttribute('mediatorid', mediatorId);

            const disposeFunction = Mediator(node, eventDispatcher) || noop;
            const disposable = {
                mediatorId: mediatorId,
                node: node,
                dispose: disposeFunction
            };
            MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;

            return disposable;

        }
    }

    /**
     *
     * @param node {HTMLElement} l'elemento rimosso dal DOM
     * @returns {boolean} ritorna true se ha trovato un mediatore da eliminare
     */
    function destroy(node) {

        const disposable = find(mediator=>mediator.node == node, MEDIATORS_CACHE);
        //var disposeFunction = MEDIATORS_CACHE[mediatorId];
        if (disposable) {
            disposable.dispose();

            MEDIATORS_CACHE = filter(_disposable=>_disposable != disposable, MEDIATORS_CACHE);
            disposable.node=null;

            return true;
        }


    }

    const DATA_MEDIATOR="data-mediator";
    const findMediators = (definitions, loader)=>node=> loader.load(definitions[node.getAttribute(DATA_MEDIATOR)]).then(create(node));

    const hasMediator = definitions=>node=>(definitions[node.getAttribute(DATA_MEDIATOR)] && !node.getAttribute("mediatorid"));
    const getAllElements = node=>[node].concat([].slice.call(node.querySelectorAll("["+DATA_MEDIATOR+"]"), 0));

    return Object.freeze({

        destroy,
        findMediators,
        hasMediator,
        getAllElements

    })
};