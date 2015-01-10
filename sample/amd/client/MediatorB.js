/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var RoboJS=require("RoboJS");


	function MediatorB() {
		RoboJS.display.Mediator.apply(this, arguments);
	}

	MediatorB.prototype = Object.create(RoboJS.display.Mediator.prototype, {
		constructor: {
			value: MediatorB
		},
		initialize: {
			value: function () {
				console.log("MediatorB", this.element);
				/**
				 * a new listener is added.
				 *
				 */
				this.addContextListener("evento", this._handleEvent, this);
			}
		},
		_handleEvent: {
			value: function (e) {
				console.log("_handleEvent", this);
				//this.removeContextListener("evento", this._handleEvento);
			}
		},
		destroy: {
			value: function () {
				console.log("destroy");
			}
		}
	});
	module.exports = MediatorB;
});