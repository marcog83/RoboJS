/**
 * Created by mgobbi on 31/03/2017.
 */
import curryN from "ramda/src/curryN";
import nextUid from "./next-uid";
const noop = _ => _;
function create(node,dispatcher,Mediator) {
    const mediatorId = nextUid();
    node.setAttribute('mediatorid', mediatorId);
    const dispose = Mediator(node, dispatcher) || noop;
    return {
        mediatorId,
        node,
        dispose
    };
}
export default curryN(3,create);