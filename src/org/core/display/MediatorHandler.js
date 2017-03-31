/**
 * Created by marco.gobbi on 21/01/2015.
 */

import {makeDispatcher} from "../events/EventDispatcher";


import create from "./create";
import inCache from "./inCache";


export default  function (params = {}) {
    //crea un'istanza dell'EventDispatcher se non viene passata
    const {selector = "data-mediator", dispatcher = makeDispatcher()} = params;
    //inizializza la cache dei mediatori registrati
    let MEDIATORS_CACHE = [];


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
            loader.load(definitions[node.getAttribute(selector)])
                .then(create(node,dispatcher))
                .then(disposable=>{
                    MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
                });


    const hasMediator = definitions =>
        node => (definitions[node.getAttribute(selector)] && !inCache(MEDIATORS_CACHE,node));
    const getAllElements = node =>
        [node].concat([].slice.call(node.querySelectorAll("[" + selector + "]"), 0));

    return Object.freeze({
        dispose,
        destroy:function(node){
            destroy(MEDIATORS_CACHE,node);
        },
        findMediators,
        hasMediator,
        getAllElements

    })
};