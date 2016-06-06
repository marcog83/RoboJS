/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

    function Mediator(node, dispatcher) {
        console.log(node);
        return function(){
            console.log("removed",node);
        }
    }


    module.exports = Mediator;
});