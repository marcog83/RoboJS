/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(["./MediatorsBuilder","./DisplayList", "../net/ScriptLoader", "./MediatorHandler"], function (MediatorsBuilder,DisplayList,  ScriptLoader, MediatorHandler) {
	"use strict";
	//it's a kind of Facade, that reduces dependencies of outside code on the inner workings of a library
	function bootstrap(config) {
		config.autoplay = config.autoplay == undefined ? true : config.autoplay;
		var displayList = new DisplayList(),
			scriptLoader = new ScriptLoader(),
			mediatorHandler = new MediatorHandler();
		/**
		 * get the mediators and return a promise.
		 * The promise argument is an Array of Mediator instances
		 */
		var builder = new MediatorsBuilder(displayList, scriptLoader, mediatorHandler, config.definitions);
		return config.autoplay ? builder.bootstrap() : builder;
	}
	return bootstrap;
});