/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	var RoboJS = require("robojs");

	function MediatorA() {
		RoboJS.display.Mediator.inherit(this, arguments);
	}

	MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {
		initialize: {
			value: function (node) {
				console.log("MediatorA", node);
			}
		}
	});
	module.exports = MediatorA;
});