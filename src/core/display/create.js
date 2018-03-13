/**
 * Created by mgobbi on 31/03/2017.
 */
import nextUid from "./next-uid";
import {curry, noop} from "../../internal";

/**
 * @param node {HTMLElement}
 * @param dispatcher {EventTarget}
 * @param Mediator {function}
 * @return {Disposable}
 */
export default curry(function (node, dispatcher, Mediator) {
    const mediatorId = nextUid();
    node.setAttribute('mediatorid', mediatorId);
    let disposable = {
        mediatorId,
        node,
        dispose: noop
    };
    if (!!node.parentNode) {

        const dispose = Mediator(node, dispatcher) || noop;
        disposable = {
            mediatorId,
            node,
            dispose
        };
    }
    return disposable
});