/**
 * Created by marco.gobbi on 21/01/2015.
 */

import {makeDispatcher} from "../events/event-dispatcher";


import create from "./create";
import inCache from "./in-cache";
import getAllElements from "./get-all-elements";
import FindMediators from "./find-mediators";

import curryN from "ramda/src/curryN";

const GetDefinition = curryN(2, function (definitions, node) {
    return definitions[node.getAttribute("data-mediator")];
});

export default  function (params) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    const {definitions = {}, dispatcher = makeDispatcher()} = params;
    //inizializza la cache dei mediatori registrati
    let MEDIATORS_CACHE = [];
    const getDefinition = GetDefinition(definitions);

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
        MEDIATORS_CACHE.forEach(disposable => {
            if (disposable) {
                disposable.dispose();
                disposable.node = null;
            }
        });
        MEDIATORS_CACHE = [];
        dispatcher.removeAllEventListeners();
    }

    function updateCache(disposable) {
        MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
    }

    var _findMediators = FindMediators(getDefinition, create, updateCache);
    // var findMediators = curryN(2, function (load, node) {
    //     return load(getDefinition(node))
    //         .then(create(node, dispatcher))
    //         .then(updateCache);
    // });

    function hasMediator(node) {
        return !!getDefinition(node) && !inCache(MEDIATORS_CACHE, node)
    }

    return Object.freeze({
        dispose,
        destroy,
        findMediators:_findMediators(dispatcher),
        hasMediator,
        getAllElements

    })
};