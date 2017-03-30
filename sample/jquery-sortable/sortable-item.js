/**
 * Created by marcogobbi on 30/03/2017.
 */
define(function () {
    return function (node) {
        console.trace("attach", node);
        return function () {
            console.log("dispose", node.getAttribute("mediatorid"));
        }
    };
});