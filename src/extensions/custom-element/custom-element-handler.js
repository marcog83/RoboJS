/**
 * Created by marcogobbi on 07/05/2017.
 */
import {makeDispatcher} from "../../core/events/event-dispatcher";
import curry from "../../internal/_curry";
import getAllElements from "./get-all-elements";
import create from "./create";
import FindMediator from "../../core/display/find-mediator";
const GetDefinition = curry(function (definitions, node) {
    return definitions[node];
});

export default params => {
    //crea un'istanza dell'EventDispatcher se non viene passata
    let {definitions = {}, dispatcher = makeDispatcher()} = params;

    let REGISTERED_ELEMENTS = {};

    function updateCache(id) {
        REGISTERED_ELEMENTS[id] = true;
        return REGISTERED_ELEMENTS;
    }

    function inCache(elements, id) {
        return !elements[id]
    }

    let getDefinition = GetDefinition(definitions);
    let _findMediator = FindMediator(getDefinition, create, updateCache);

    function isKnownElement(id) {
        return !(document.createElement(id) instanceof HTMLUnknownElement);
    }

    function hasMediator(node) {
        let id = node.tagName.toLowerCase();
        return !!getDefinition(id) && !inCache(REGISTERED_ELEMENTS, id) && !isKnownElement(id);
    }

    let noop = _ => _;
    return Object.freeze({
        dispose: noop,
        destroy: noop,
        findMediator: _findMediator(dispatcher),
        hasMediator,
        getAllElements

    })
}