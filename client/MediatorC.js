/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require) {
	"use strict";
	var Mediator = require("../org/display/Mediator");

	function MediatorC() {
		Mediator.apply(this, arguments);
	}

	MediatorC.prototype = Object.create(Mediator.prototype, {
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