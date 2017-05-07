/**
 * Created by marco.gobbi on 09/12/2014.
 */
function handler(e) {
    e.currentTarget.parentNode.removeChild(e.currentTarget)
}
function Mediator(node) {
    node.addEventListener("click", handler, false);
    return function () {
        node.removeEventListener("click", handler)
    }
}


module.exports = Mediator;