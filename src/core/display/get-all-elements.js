/**
 * Created by marcogobbi on 01/04/2017.
 */

export default function ( node) {
    return [node].concat([].slice.call(node.querySelectorAll("[data-mediator]"), 0));
}