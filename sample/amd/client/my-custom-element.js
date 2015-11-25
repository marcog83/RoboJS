/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

    function Mediator(dispatcher) {
        return {
            initialize:function(n){
                "use strict";
                console.log("weee")
            }
            //destroy:console.log.bind(console,"destroyed")
        }
    }


    module.exports = Mediator;
});