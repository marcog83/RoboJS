/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {


	function MediatorA() {
		return {
			initialize:function(node){
				"use strict";
				console.log("MediatorA", node);
			}
		}
	}


	module.exports = MediatorA;
});