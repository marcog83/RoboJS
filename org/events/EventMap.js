/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var EventMapConfig = require("./EventMapConfig");

	function EventMap() {
		this._listeners = [];
		//this._suspendedListeners = [];
		//this._suspended = false;
	}

	EventMap.prototype = {
		mapListener: function (dispatcher, eventString, listener, scope) {
			var currentListeners = this._listeners;
			/*this._suspended
			 ? this._suspendedListeners
			 : this._listeners;*/
			//
			var config;
			var i = currentListeners.length;
			while (i--) {
				config = currentListeners[i];
				if (config.equalTo(dispatcher, eventString, listener)) {
					return;
				}
			}
			var callback = listener;
			/* EventMapConfig instance*/
			config = new EventMapConfig(dispatcher, eventString, listener, callback,scope);

			currentListeners.push(config);
			//if (!this._suspended) {
				dispatcher.addEventListener(eventString, callback, scope);
			//}
		},
		unmapListener: function (dispatcher, eventString, listener) {
			var currentListeners = this._listeners;
			/*this._suspended
			 ? this._suspendedListeners
			 : this._listeners;*/
			var i = currentListeners.length;
			while (i--) {
				var config = currentListeners[i];
				if (config.equalTo(dispatcher, eventString, listener)) {
					//if (!this._suspended) {
					dispatcher.removeEventListener(eventString, config.callback, config.scope);
					//}
					currentListeners.splice(i, 1);
					return;
				}
			}
		},
		unmapListeners: function () {
			var currentListeners = this._listeners;
			/*this._suspended
			 ? this._suspendedListeners
			 : this._listeners;*/
			var eventConfig;
			var dispatcher;
			while (eventConfig = currentListeners.pop()) {
				//if (!this._suspended) {
				dispatcher = eventConfig.dispatcher;
				dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);
				//}
			}
		}
	};
	module.exports = EventMap;
});