/**
 * Created by marcogobbi on 07/05/2017.
 */

export default  function (inCache, updateCache) {
    return function create(node, dispatcher) {
        return function (Mediator) {
            var tagName = "";
            if (!inCache(node.tagName.toLowerCase())) {
                tagName = node.tagName.toLowerCase();
                var customProto = Mediator(dispatcher);
                var proto = Object.assign(Object.create(HTMLElement.prototype), customProto);
                document.registerElement(tagName, {prototype: proto});
                updateCache(tagName);
            }
            return tagName;

        }
    }
}