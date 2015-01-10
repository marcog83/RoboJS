/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

	var RoboJS=require("RoboJS");

	function MediatorA() {
		RoboJS.display.Mediator.apply(this, arguments);
	}

	MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {
		 
		initialize: {
			value: function () {
				console.log("MediatorA", this.element);
			}
		}
	});
	module.exports = MediatorA;
});