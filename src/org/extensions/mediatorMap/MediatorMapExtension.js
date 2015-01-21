define(function (require, exports, module) {
	'use strict';
	var RoboJS = require("RoboJS");
	var MediatorMapExtension = {
		extend: function (context) {
			this.injector = context.injector;
			this.injector.map(["Injector",RoboJS.display.MediatorHandler],"MediatorHandler").asSingleton();
			this.injector.map([
				'DisplayList',
				'ScriptLoader',
				'MediatorHandler',
				'MediatorsMap',
				RoboJS.display.MediatorsBuilder
			], 'MediatorsBuilder').asSingleton();
			this.injector.map(RoboJS.events.EventDispatcher, 'EventDispatcher').asSingleton();
			this.injector.map(RoboJS.events.EventMap, 'EventMap');
		},
		initialize: function () {
			var builder = this.injector.getInstance('MediatorsBuilder');
			builder.bootstrap();
		}
	};
	module.exports = MediatorMapExtension;
});