/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var Mediator = require("../../src/org/display/Mediator");


	function MediatorB() {
		Mediator.apply(this, arguments);
	}

	MediatorB.prototype = Object.create(Mediator.prototype, {
		constructor: {
			value: MediatorB
		},
		initialize: {
			value: function () {
				console.log("ModuleB" + this);
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