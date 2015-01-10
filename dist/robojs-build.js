(function( global, factory ) {

	factory( global );

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window ) {


/**
 * Created by marco on 10/01/2015.
 */

    var RoboJS = {
        org: {}
    };
    
/**
 * Created by marco.gobbi on 07/11/2014.
 */

	"use strict";
	var signals = require("signals");
	var _ = require("lodash");

	function DisplayList() {
		this.onAdded = new signals.Signal();
		this.onRemoved = new signals.Signal();
		// The node to be monitored
		// Create an observer instance
		var observer = new MutationObserver(this.handleMutations.bind(this));
		// Configuration of the observer:
		// Pass in the target node, as well as the observer options
		observer.observe(document.body, {
			attributes: false,
			childList: true,
			characterData: false
		});
	}

	DisplayList.prototype = {
		handleMutations: function (mutations) {
			var response = _.reduce(mutations, function (result, mutation, index) {
				result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
				result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
				return result;
			}, {addedNodes: [], removedNodes: []});
			//
			response.addedNodes.length && this.onAdded.dispatch(response.addedNodes);
			response.removedNodes.length && this.onRemoved.dispatch(response.removedNodes);
		}
	};
	module.exports = DisplayList;

/**
 * Created by marco on 19/12/2014.
 */



(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define('EventDispatcher',[], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory;
	} else {
		// Browser globals (root is window)
		root.EventDispatcher = factory;
	}
}(this, function () {
	function EventDispatcher() {
		this._currentListeners = {};
	}

	EventDispatcher.prototype = {
		/**
		 *
		 * @param type
		 * @param callback
		 * @param scope
		 * @returns {*}
		 */
		addEventListener: function (type, callback, scope) {
			var listener = {
				type: type,
				callback: callback,
				scope: scope
			};
			if (!this._currentListeners[type]) {
				this._currentListeners[type] = [];
			}
			this._currentListeners[type].push(listener);
			return listener;
		},
		/**
		 *
		 * @param eventName
		 * @param callback
		 * @param scope
		 */
		removeEventListener: function (eventName, callback, scope) {
			var listeners = this._currentListeners[eventName] || [];
			this._currentListeners[eventName] = listeners.filter(function (listener) {
				var sameCB = listener.callback == callback;
				var sameScope = listener.scope == scope;
				return !(sameCB && sameScope);
			});
		},
		removeAllEventListeners: function (eventName) {
			// var listeners = this._currentListeners[eventName] || [];
			this._currentListeners[eventName] = null;
		},
		/**
		 *
		 * @param eventName
		 * @returns {*}
		 */
		hasEventListener: function (eventName) {
			return this._currentListeners[eventName] && this._currentListeners[eventName].length
		},
		/**
		 *
		 * @param type
		 * @param data
		 */
		dispatchEvent: function (type, data) {
			var listeners = this._currentListeners[type] || [];
			var length = listeners.length, l, c, s;
			for (var i = 0; i < length; i++) {
				l = listeners[i];
				c = l.callback;
				s = l.scope;
				c.call(s, data);
			}
		}
	};
	var ____instance;
	EventDispatcher.getInstance = function () {
		"use strict";
		if (!____instance) {
			____instance = new EventDispatcher();
		}
		return ____instance;
	};
	return EventDispatcher;
}));

/**
 * Created by marco.gobbi on 18/12/2014.
 */

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

/**
 * Created by marco.gobbi on 18/12/2014.
 */

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

/**
 * Created by marco.gobbi on 18/12/2014.
 */

	"use strict";
	var EventDispatcher = require("EventDispatcher");
	var EventMap = require("../events/EventMap");

	/**
	 *
	 *
	 * @constructor
	 * @param element {HTMLElement}
	 *
	 * @property element {HTMLElement}
	 * @property eventMap {EventMap}
	 * @property eventDispatcher {EventDispatcher}
	 */
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
		 * @param eventString {string}
		 * @param listener {function}
		 * @param scope {*} the context where 'this' is bind to
		 */
		addContextListener: function (eventString, listener,scope) {
			this.eventMap.mapListener(this.eventDispatcher, eventString, listener,scope);
		},
		/**
		 * @public
		 * @param eventString {string}
		 * @param listener {function}
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

/**
 * Created by marco.gobbi on 07/01/2015.
 */

	"use strict";
	var Promise = require("bluebird");
	function ScriptLoader() {}

	ScriptLoader.prototype = {
		require: function (id) {
			return new Promise(function (resolve, reject) {
				require([id], function (Mediator) {
					resolve(Mediator);
				});
			});
		}
	};
	module.exports = new ScriptLoader();

/**
 * Created by marco.gobbi on 09/12/2014.
 */

	"use strict";
	var DisplayList = require("./DisplayList");
	var ScriptLoader = require("../net/ScriptLoader");
	var signals = require("signals");
	var _ = require("lodash");
	var Promise = require("bluebird");
	var CACHE = {};
	var Utils = {
		uid: [
			'0',
			'0',
			'0'
		],
		nextUid: function () {
			var index = Utils.uid.length;
			var digit;
			while (index) {
				index--;
				digit = Utils.uid[index].charCodeAt(0);
				if (digit == 57 /*'9'*/) {
					Utils.uid[index] = 'A';
					return Utils.uid.join('');
				}
				if (digit == 90  /*'Z'*/) {
					Utils.uid[index] = '0';
				} else {
					Utils.uid[index] = String.fromCharCode(digit + 1);
					return Utils.uid.join('');
				}
			}
			Utils.uid.unshift('0');
			return Utils.uid.join('');
		}
	};

	function MediatorsBuilder(_definition) {
		this.onAdded = new signals.Signal();
		this.onRemoved = new signals.Signal();
		this.definitions = _definition || [];
		this.displayList = new DisplayList();
		this.displayList.onAdded.add(this._handleNodesAdded, this);
		this.displayList.onRemoved.add(this._handleNodesRemoved, this);
	}

	MediatorsBuilder.prototype = {
		bootstrap: function () {
			return this.getMediators([document.body]);
		},
		getMediators: function (target) {
			var promises = _.chain(target)
				.reduce(this._reduceNodes, [])
				.reduce(this._findMediators.bind(this), [])
				.value();
			// find every children
			//
			// find the promises for each Mediator
			// for each node it increase the result Array (3^ parameter) and return it to promises.
			return Promise.all(promises);
		},
		_findMediators: function (result, node, index) {
			// prefill _initMediator with node parameter
			var _partialInit = _.partial(this._initMediator, node);
			// filter definitions based on actual Node
			// once you get the Mediators you need, load the specific script.
			var mediators = _.chain(this.definitions)
				.filter(function (def) {
					return node.dataset && node.dataset.mediator == def.id;
				})
				.map(function (def) {
					return ScriptLoader.require(def.mediator).then(_partialInit);
				}).value();
			// add mediators promise to the result Array
			return result.concat(mediators);
		},
		_initMediator: function (node, Mediator) {
			var mediatorId = Utils.nextUid();
			node.dataset = node.dataset || {};
			node.dataset.mediatorId = mediatorId;
			var _mediator = new Mediator(node);
			_mediator.id = mediatorId;
			CACHE[mediatorId] = _mediator;
			_mediator.initialize();
			return _mediator;
		},
		_handleNodesAdded: function (nodes) {
			this.getMediators(nodes).then(function (mediators) {
				if (mediators.length) {
					this.onAdded.dispatch(mediators);
				}
			}.bind(this));
		},
		_handleNodesRemoved: function (nodes) {
			console.log("_handleNodesRemoved");
			_.chain(nodes)
				.reduce(this._reduceNodes, [])
				.forEach(this._destroyMediator.bind(this))
		},
		_reduceNodes: function (result, node) {
			var n = [].slice.call(node.getElementsByTagName("*"), 0);
			n.unshift(node);
			return result.concat(n);
		},
		_destroyMediator: function (node) {
			var mediatorId = node.dataset && node.dataset.mediatorId;
			var mediator = CACHE[mediatorId];
			if (mediator) {
				mediator.destroy && mediator.destroy();
				mediator.postDestroy && mediator.postDestroy();
				mediator.element && (mediator.element = null);
			}
			this.onRemoved.dispatch(mediator);
			CACHE[mediatorId] = null;
			mediator = null;
		}
	};
	module.exports = MediatorsBuilder;

/**
 * Created by marco on 10/01/2015.
 */


    RoboJS.org.display = {
        DisplayList: DisplayList,
        Mediator: Mediator,
        MediatorsBuilder: MediatorsBuilder
    };



/**
 * Created by marco on 10/01/2015.
 */


    RoboJS.org.events = {
        EventDispatcher: EventDispatcher,
        EventMap: EventMap,
        EventMapConfig: EventMapConfig
    };


/**
 * Created by marco on 10/01/2015.
 */

    RoboJS.org.net = {

        ScriptLoader: ScriptLoader
    };


;




if ( typeof define === "function" && define.amd ) {
    define( "RoboJS", [], function() {
        return RoboJS;
    });
}else {
    // Leak RoboJS namespace
    window.RoboJS = RoboJS;
};
}));
