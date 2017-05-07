/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

    function handler(e){
        e.currentTarget.parentElement.removeChild(e.currentTarget);
        e.stopPropagation();
    }
	function BarElement(node,dispatcher) {

		node.addEventListener("click",handler);
		return function(){
			node.removeEventListener("click",handler);
			console.log("destroyed")
		}
	}


	module.exports = BarElement;
});