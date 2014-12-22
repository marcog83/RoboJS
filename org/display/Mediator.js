/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require,exports,module) {
	"use strict";
	var EventDispatcher = require("../events/EventDispatcher");
	var EventMap = require("../events/EventMap");

	function Mediator(element) {
		this.element = element;
		this.eventMap = new EventMap();
		this.eventDispatcher=EventDispatcher.getInstance();
	}

	Mediator.prototype = {
		/**
		 * @public
		 */
		postDestroy: function () {
			console.log("postDestroy");
			this.eventMap.unmapListeners();
		},
		/**
		 *
		 * @param eventString
		 * @param listener
		 * @param scope
		 */
		addContextListener: function (eventString, listener,scope) {
			this.eventMap.mapListener(this.eventDispatcher, eventString, listener,scope);
		},
		/**
		 * @public
		 * @param eventString
		 * @param listener
		 */
		removeContextListener: function (eventString, listener) {
			this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
		},
		/**
		 * @public
		 * @param eventString {string}
		 */
		dispatch: function (eventString) {
			if (this.eventDispatcher.hasEventListener(eventString)) {
				this.eventDispatcher.dispatchEvent(eventString);
			}
		},
		/**
		 * @public
		 */
		initialize: function () {
			console.log("Mediator",this);
		},
		/**
		 * @public
		 */
		destroy: function () {
			//
		}
	};
	module.exports= Mediator;
});