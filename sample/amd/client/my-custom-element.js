/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

    function Mediator(dispatcher) {
        return {
            initialize:console.log.bind(console,"initialized"),
            destroy:console.log.bind(console,"destroyed")
        }
    }


    module.exports = Mediator;
});