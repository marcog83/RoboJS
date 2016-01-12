/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {


	function BarElement(node,dispatcher) {
		return {
			initialize:function(){
				node.addEventListener("click",function(e){
					e.currentTarget.parentElement.removeChild(e.currentTarget);
					e.stopPropagation();
				})
			},
			destroy:function(){
				"use strict";
				console.log("destroyed")
			}
		}
	}


	module.exports = BarElement;
});