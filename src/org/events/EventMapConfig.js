/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require,exports,module) {
	"use strict";
	function EventMapConfig(dispatcher, eventString, listener, callback,scope) {
		this.dispatcher = dispatcher;
		this.eventString = eventString;
		this.listener = listener;
		this.callback = callback;
		this.scope = scope;
	}

	EventMapConfig.prototype = {
		equalTo: function (dispatcher, eventString, listener) {
			return this.eventString == eventString
					//&& this.eventClass == eventClass
				&& this.dispatcher == dispatcher
				&& this.listener == listener;
			//&& this.useCapture == useCapture;
		}
	};
	module.exports = EventMapConfig;
});