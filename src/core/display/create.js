/**
 * Created by mgobbi on 31/03/2017.
 */
import curry from "../../internal/_curry";
import nextUid from "./next-uid";
const noop = _ => _;
function create(node, dispatcher, Mediator) {
    const mediatorId = nextUid();
    node.setAttribute('mediatorid', mediatorId);
    const dispose = Mediator(node, dispatcher) || noop;
    return {
        mediatorId,
        node,
        dispose
    };
}
export default curry(create);