/**
 * Created by marcogobbi on 07/05/2017.
 */

export default  function create(node,dispatcher) {
    return function (Mediator) {
        var customProto = Mediator();
        var proto = Object.assign(Object.create(HTMLElement.prototype), customProto, {dispatcher});
        document.registerElement(node.tagName.toLowerCase(), {prototype: proto});
        return true;

    }
}