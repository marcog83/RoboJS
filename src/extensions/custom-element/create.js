/**
 * Created by marcogobbi on 07/05/2017.
 */

export default function (inCache, updateCache) {


    return function create(node, dispatcher) {
        return function (Mediator) {
            var tagName = "";
            if (!inCache(node.tagName.toLowerCase())) {
                tagName = node.tagName.toLowerCase();
                if (!tagName.match(/-/gim)) {
                    throw new Error("The name of a custom element must contain a dash (-). So <x-tags>, <my-element>, and <my-awesome-app> are all valid names, while <tabs> and <foo_bar> are not.")
                }
                window.customElements.define(tagName, class extends Mediator {
                    constructor() {
                        super(dispatcher);
                    }
                });
                //  var proto = Object.assign(Object.create(HTMLElement.prototype), customProto);
                //   document.registerElement(tagName, {prototype: proto});
                updateCache(tagName);
            }
            return tagName;

        }
    }
}