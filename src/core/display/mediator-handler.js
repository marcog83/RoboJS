/**
 * Created by marco.gobbi on 21/01/2015.
 */

import {makeDispatcher} from "../events/event-dispatcher";


import create from "./create";
import inCache from "./in-cache";
import getAllElements from "./get-all-elements";
import FindMediator from "./find-mediator";
import {curry} from "../../internal";

const GetDefinition = curry(function (definitions, node) {
    return definitions[node.getAttribute("data-mediator")];
});

function destroy(node, MEDIATORS_CACHE) {
    for (let i = 0; i < MEDIATORS_CACHE.length; i++) {
        let disposable = MEDIATORS_CACHE[i];
        if (disposable && disposable.node === node) {
            disposable.dispose();
            disposable.node = null;
            MEDIATORS_CACHE[i] = null;
            MEDIATORS_CACHE.splice(i, 1);
        }
    }
    return MEDIATORS_CACHE;
}

export default function (params) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    let {definitions = {}, dispatcher = makeDispatcher()} = params || {};
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
            return destroy(node, MEDIATORS_CACHE);
        },
        findMediator: _findMediator(dispatcher),
        hasMediator,
        getAllElements

    })
};