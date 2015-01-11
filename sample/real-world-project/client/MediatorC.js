/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require) {
	"use strict";
	var RoboJS=require("RoboJS");

	function MediatorC() {
		RoboJS.display.Mediator.apply(this, arguments);
	}

	MediatorC.prototype = Object.create(RoboJS.display.Mediator.prototype, {
		initialize: {
			value:function () {
				console.log("ModuleC: " + this.element.innerHTML);
			}
		},
		destroy: {
			value:function () {
				console.log(this.element);
			}
		}
	});
	return MediatorC;
});