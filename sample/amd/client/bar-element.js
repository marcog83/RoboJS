/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {


	function BarElement(dispatcher) {
		return {
			initialize:function(node){
				node.addEventListener("click",function(e){
					e.currentTarget.parentElement.removeChild(e.currentTarget);
					e.stopPropagation();
				})
			},
			destroy:function(n){
				"use strict";
				console.log("destroyed")
			}
		}
	}


	module.exports = BarElement;
});