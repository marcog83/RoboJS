/**
 * Created by marcogobbi on 07/05/2017.
 */
import getAllElements from "./get-all-elements";
import getCreate from "./create";
import FindMediator from "../../core/display/find-mediator";
import {curry, noop} from "../../internal";
import {makeDispatcher} from "../../core";

const GetDefinition = curry(function (definitions, node) {
    return definitions[node.tagName.toLowerCase()];
});

export default params => {
    //crea un'istanza dell'EventDispatcher se non viene passata
    let {definitions = {}, dispatcher = makeDispatcher()} = params;

    let REGISTERED_ELEMENTS = {};

    function updateCache(id) {
        REGISTERED_ELEMENTS[id] = true;
        return REGISTERED_ELEMENTS;
    }

    var inCache = curry(function (elements, id) {
        return !!elements[id]
    });

    let getDefinition = GetDefinition(definitions);
    let _findMediator = FindMediator(getDefinition, getCreate(inCache(REGISTERED_ELEMENTS), updateCache), noop);


    function hasMediator(node) {
        let id = node.tagName.toLowerCase();
        return !!getDefinition(node) && !inCache(REGISTERED_ELEMENTS, id);
    }


    return Object.freeze({
        dispose: noop,
        destroy: noop,
        findMediator: _findMediator(dispatcher),
        hasMediator,
        getAllElements

    })
}