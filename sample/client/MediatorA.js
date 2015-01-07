/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {

	var Mediator = require("../../src/org/display/Mediator");

	function MediatorA() {
		Mediator.apply(this, arguments);
	}

	MediatorA.prototype = Object.create(Mediator.prototype, {
		 
		initialize: {
			value: function () {
				console.log("MediatorA", this.element);
			}
		}
	});
	module.exports = MediatorA;
});