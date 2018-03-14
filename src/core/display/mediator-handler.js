/**
 * Created by marco.gobbi on 21/01/2015.
 */

import EventTarget from "../events/event-dispatcher";


import create from "./create";
import destroy from "./destroy-mediator";
import inCache from "./in-cache";
import getAllElements from "./get-all-elements";
import FindMediator from "./find-mediator";
import {curry} from "../../internal";

const GetDefinition = curry(function (definitions, node) {
    return definitions[node.getAttribute("data-mediator")];
});

/**
 *
 *
 * @param params {MediatorHandlerParams}
 * @return {Handler}
 */
export default function (params) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    let {definitions = {}, dispatcher = new EventTarget()} = params || {};
    //inizializza la cache dei mediatori registrati
    let MEDIATORS_CACHE = [];
    let getDefinition = GetDefinition(definitions);

    function dispose() {
        MEDIATORS_CACHE.forEach(disposable => {
            if (disposable) {
                disposable.dispose();
                disposable.node = null;
            }
        });
        MEDIATORS_CACHE = null;
        dispatcher.listeners_ = null;
        dispatcher = null;
        _findMediator = null;
        definitions = null;
        getDefinition = null;
    }

    function updateCache(disposable) {
        MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
        return MEDIATORS_CACHE;
    }

    var _findMediator = FindMediator(getDefinition, create, updateCache);


    function hasMediator(node) {
        return !!getDefinition(node) && !inCache(MEDIATORS_CACHE, node)
    }

    return Object.freeze({
        dispose,
        destroy: node => {
            MEDIATORS_CACHE=destroy(node, MEDIATORS_CACHE);
            return MEDIATORS_CACHE
        },
        findMediator: _findMediator(dispatcher),
        hasMediator,
        getAllElements

    })
};