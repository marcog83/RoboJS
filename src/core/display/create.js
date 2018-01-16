/**
 * Created by mgobbi on 31/03/2017.
 */
import nextUid from "./next-uid";
import {curry, noop} from "@robojs/internal";

export default curry(function (node, dispatcher, Mediator) {
    const mediatorId = nextUid();
    node.setAttribute('mediatorid', mediatorId);
    const dispose = Mediator(node, dispatcher) || noop;
    return {
        mediatorId,
        node,
        dispose
    };
});