define([
	"../../core.js",
	"../../display/MediatorsBuilder",
	"../../display/DisplayList",
	"./MediatorHandler",
	"../../events/EventDispatcher",
	"../../events/EventMap",
	"../../net/ScriptLoader"
], function (RoboJS, MediatorsBuilder, DisplayList, MediatorHandler, EventDispatcher, EventMap, ScriptLoader) {
	'use strict';
	var MediatorMapExtension = {
		extend: function (context) {
			this.injector = context.injector;
			// map how to handle Mediator Creation
			this.injector.map([
				"Injector",
				MediatorHandler
			], "MediatorHandler").asSingleton();
			// how to handle DOM changes
			this.injector.map(DisplayList, 'DisplayList');
			// how to load external scripts
			this.injector.map(ScriptLoader, 'ScriptLoader');
			// map MediatorsBuilder
			this.injector.map([
				'DisplayList',
				'ScriptLoader',
				'MediatorHandler',
				'MediatorsMap',
				MediatorsBuilder
			], 'MediatorsBuilder').asSingleton();
			// map EventDispatcher
			this.injector.map(EventDispatcher, 'EventDispatcher').asSingleton();
			// map EventMap
			this.injector.map(EventMap, 'EventMap');
		},
		initialize: function () {
			// when all dependencies are ready, bootstrap MediatorsBuilder
			var builder = this.injector.getInstance('MediatorsBuilder');
			builder.bootstrap();
		}
	};
	return MediatorMapExtension;
});