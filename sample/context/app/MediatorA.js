/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	var RoboJS = require("RoboJS");

	function MediatorA(eventDispatcher, eventMap) {
		RoboJS.display.Mediator.inherit(this, arguments);
	}

	// set a name to prevent minification issues;
	MediatorA.$name = "MediatorA";
	// all dependencies. By Default eventDispatcher and EventMap will be injected as last 2 deps.
	MediatorA.$inject = [];
	MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {
		initialize: {
			value: function (node) {
				this.element = node;
				console.log("MediatorA", this.element);
			}
		}
	});
	module.exports = MediatorA;
});