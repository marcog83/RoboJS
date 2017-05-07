/**
 * Created by marco.gobbi on 09/12/2014.
 */
function FooElement(node, dispatcher) {
    function handler(e) {
        e.currentTarget.parentElement.removeChild(e.currentTarget);
        e.stopPropagation();
    }
    node.addEventListener("click", handler);
    return function () {
        node.removeEventListener("click", handler);
        console.log("destroyed")
    }
}


module.exports = FooElement;