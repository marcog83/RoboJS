/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
	"use strict";
	var RoboJS = require("robojs");
	var MediatorsMap = require("./MediatorsMap");

	/*
	 create an array of jQuery elements to append to the body on "click"
	 */
	var elements = [];
	elements.push($("<div data-mediator='mediator-c'><ul><li>lista a caso</li></ul></div>"));
	elements.push($('<div data-mediator="mediator-a">' +
	'<div data-mediator="mediator-a">' +
	' <div data-mediator="mediator-b">aab' +
	'</div>' +
	' </div>	' +
	'</div>'));
	elements.push($("" +
	"<div data-mediator='mediator-a'>primo nodo</div>" +
	"<div data-mediator='mediator-a'>secondo nodo</div>" +
	"<div data-mediator='mediator-c'>mediator c</div>" +
	"<span data-mediator='mediator-b'></span>"));
	/*
	 helper function to get a random number from min to max
	 */
	function getRandomArbitrary(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}

	function Application() {
		/**
		 * EventDispatcher is the Singleton that is used to dispatch and listen to the events
		 */
		this.eventDispatcher = RoboJS.events.EventDispatcher;
	}

	Application.prototype = {
		main: function () {
			/**
			 *
			 * @type {function}
			 * bootstrap is a sugar function to hide internal dependencies.
			 * A MediatorsBuilder is created.
			 * MediatorsBuilder will iterate the DOM trying to match MediatorsMap ids with data-mediator attribute.
			 * @return {RoboJS.display.MediatorsBuilder} if autoplay is false. By default autoplay is true and it returns a Promise.
			 * Promise is meant to be resolved when every mediators are loaded.
			 *
			 */

			var builder = RoboJS.display.bootstrap({definitions: MediatorsMap, autoplay: false,scriptLoader:RoboJS.net.AMDScriptLoader});
			/**
			 * get the mediators and return a promise.
			 * The promise argument is an Array of Mediator instances
			 */
			builder.bootstrap().then(function (mediators) {
				console.log("Mediators loaded", mediators);
			}).catch(function (e) {
				console.log(e);
			});
			/**
			 * when new DOM nodes are added to the document MutationObserver notify it, and a onAdded Signal is dispatched.
			 * The Signal argument is an Array of Mediator instances
			 */
			builder.onAdded.connect(function (mediators) {
				console.log("Mediators added async", mediators);
			});
			/**
			 * when new DOM nodes are removed from the document MutationObserver notify it, and a onRemoved Signal is dispatched.
			 * The Signal argument is an instances of Mediator.
			 */
			builder.onRemoved.connect(function (mediator) {
				console.log("Mediators onRemoved async", mediator);
			});
			/**
			 * on click a new random element is added to the DOM tree
			 */
			$(".add-button").on("click", function () {
				var index =0; //getRandomArbitrary(0, 2);
				// NB if you don't clone the element, the same element will be
				// first removed from tree (and mediator is destroyed too)
				// then attached to body again (and a new mediator is created)
				var element = elements[index].clone();
				/**
				 * when an element is clicked, it will be removed.
				 * Every Mediators will be removed too.
				 */
				element.click(function (e) {
					element.remove();
				});
				$("body").append(element);
			});
			/**
			 * this is an example of Event dispatching.
			 * MediatorB listens to it. When a new MediatorB instance is created, a new console.log is shown.
			 */
			setInterval(function () {
				this.eventDispatcher.dispatchEvent("evento", {name: "evento"});
			}.bind(this), 4000);
		}
	};
	return new Application();
});