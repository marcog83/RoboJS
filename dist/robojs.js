(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(["Promise"], factory);
	} else {
		root.RoboJS = factory(root.Promise);
	}
}(this, function (Promise) {
	'use strict';

    /**
     <h1>RoboJS</h1>
     <p>RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
     Add a node to the DOM and a JS will be loaded!
     Remove a node and the JS will be disposed!!</p>

     <h1>Installation</h1>
     <p><pre><code>bower install robojs</code></pre></p>
     <h1>Dependencies</h1>

     <p>RoboJS depends on ES5 for</p>
     <ul>
        <li>Array.prototype.reduce()</li>
        <li>Array.prototype.map()</li>
        <li>Array.prototype.filter()</li>
     </ul>
     <p><a href="https://github.com/petkaantonov/bluebird">bluebird</a> or <a href="https://github.com/kriskowal/q">Q.js</a>
     can be used where native Promise is not implemented.
     </p>
     <p><a href="http://requirejs.org">RequireJS</a> is used internally as script loader in <code>ScriptLoader</code> Class.
     You can override <code>loader</code> property of <code>MediatorsBuilder</code> instance with your own implementation to load JS.</p>

     <p>This is an example how you can set dependencies in AMD with RequireJS</p>

     ```javascript
     requirejs.config({
         paths: {
            Promise: "path/to/any/promise/implementation",
            RoboJS: "bower_components/robojs/dist/robojs.min"
         }
     });
     ```
     <p>or using Globals</p>
     ```html
     <script src="robojs.min.js"></script>
     ```

     <h1>Usage</h1>
     <p>You set a <code>data-mediator</code> attribute with an ID (whatever you want)
     ```html
     <div data-mediator="mediator-a">a-2</div>
     <div data-mediator="mediator-b">b-1</div>
     <div data-mediator="mediator-c">c-1</div>
     ```
     in <code>MediatorsMap.js</code> you define an Array that maps an ID and a Mediator path

     ```javascript
     [
     {
         "id": "mediator-a",
         "mediator": "client/MediatorA"
     },
     {
         "id": "mediator-b",
         "mediator": "client/MediatorB"
     },
     {
         "id": "mediator-c",
         "mediator": "client/MediatorC"
     }
     ]
     ```

     For instance in this sample I mapped 3 different Mediators.

     When the builder finds a match between a <code>data-mediator</code> attribute and an ID from <code>MediatorsMap</code>,
     it will create a new instance of Mediator, storing the DOM Node into a property named <code>element</code> and executes <code>initialize</code> method
     </p>
     <p>
     In this example we create an instance of <code>MediatorsBuilder</code> passing the map of Mediators.
     ```javascript
     var RoboJS=require("RoboJS");
     var MediatorsMap = require("./MediatorsMap");

     var builder = new RoboJS.display.MediatorsBuilder(MediatorsMap);
     builder.bootstrap().then(function (mediators) {
        // Mediators loaded --> mediators
    }).catch(function (e) { //catch an error});
     ```

     <p>
      When new DOM nodes are added to the document MutationObserver notify it, and a onAdded Signal is dispatched.
      The Signal argument is an Array of Mediator instances
     </p>
     ```javascript
     builder.onAdded.connect(function (mediators) {
        // Mediators added async --> mediators
    });
     ```
     <p>
       when new DOM nodes are removed from the document MutationObserver notify it, and a onRemoved Signal is dispatched.
       The Signal argument is an instances of Mediator.
     </p>
     ```javascript
     builder.onRemoved.connect(function (mediator) {
        // Mediator onRemoved async --> mediator
    });
     ```
     <p>
     In this example <code>bootstrap</code> method scans <code>document.body</code> looking for <code>data-mediator</code> attribute.<br/>
     But let's say... you dynamically attached some elements to the DOM.
     Well MutationObserver notify it and the <code>MediatorsBuilder</code> takes care to create the right Mediators.</p>

     ```javascript
     $(".add-button").on("click", function () {
        var element = $('<div data-mediator="mediator-b"></div>');
        element.click(function (e) {
            element.remove();
        });
        $("body").append(element);
    });
     ```
     <p>On click a new random <code>element</code> is added to the DOM tree, when an <code>element</code> is clicked, it will be removed.<br/>
     Every Mediators will be removed too.</p>

     </p>
     <h1>Api Reference</h1>
     */
    var RoboJS = {
        MEDIATORS_CACHE: {},
        utils: {
            uid: [
                '0',
                '0',
                '0'
            ],
            nextUid: function () {
                var index = this.uid.length;
                var digit;
                while (index) {
                    index--;
                    digit = this.uid[index].charCodeAt(0);
                    if (digit == 57 /*'9'*/) {
                        this.uid[index] = 'A';
                        return this.uid.join('');
                    }
                    if (digit == 90  /*'Z'*/) {
                        this.uid[index] = '0';
                    } else {
                        this.uid[index] = String.fromCharCode(digit + 1);
                        return this.uid.join('');
                    }
                }
                this.uid.unshift('0');
                return this.uid.join('');
            }
        }
    };
    

     /*
     <h2>Signal</h2>
     <p>Signals and slots are used for communication between objects. The signals and slots mechanism is a central feature of Qt </p>
     <p>A <code>signal</code> is emitted when a particular event occurs.
     A <code>slot</code> is a function that is called in response to a particular <code>signal</code>.
     You can connect as many signals as you want to a single slot, and a signal can be connected to as many slots as you need.

     </p>


      */
    function Signal() {

        this.listenerBoxes = [];

        this._valueClasses = null;

        this.listenersNeedCloning = false;

        this.setValueClasses(arguments);
    }

    Signal.prototype = {
        getNumListeners: function () {
            return this.listenerBoxes.length;
        },
        getValueClasses: function () {
            return this._valueClasses;
        },
        /**
         <h3>connect</h3>
         <p>Connects the signal this to the incoming slot.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connect: function (slot, scope) {
            this.registerListener(slot, scope, false);
        },
        /**
         <h3>connectOnce</h3>
         <p></p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connectOnce: function (slot, scope) {
            this.registerListener(slot, scope, true);
        },
        /**
         <h3>disconnect</h3>
         <p>the given slot are disconnected.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        disconnect: function (slot, scope) {
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
                this.listenersNeedCloning = false;
            }

            for (var i = this.listenerBoxes.length; i--;) {
                if (this.listenerBoxes[i].listener == slot && this.listenerBoxes[i].scope == scope) {
                    this.listenerBoxes.splice(i, 1);
                    return;
                }
            }
        },
        /**
         <h3>disconnectAll</h3>
         <p>Disconnects all slots connected to the signal.</p>

         */
        disconnectAll: function () {

            for (var i = this.listenerBoxes.length; i--;) {
                this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        },
        /**
         <h3>emit</h3>
         <p>Dispatches an event into the signal flow.</p>

         */
        emit: function () {
            var valueObject;
            for (var n = 0; n < this._valueClasses.length; n++) {
                if (this.primitiveMatchesValueClass(arguments[n], this._valueClasses[n]))
                    continue;

                if ((valueObject = arguments[n]) == null || valueObject instanceof this._valueClasses[n])
                    continue;

                throw new Error('Value object <' + valueObject
                + '> is not an instance of <' + this._valueClasses[n] + '>.');
            }

            var listenerBoxes = this.listenerBoxes;
            var len = listenerBoxes.length;
            var listenerBox;

            this.listenersNeedCloning = true;
            for (var i = 0; i < len; i++) {
                listenerBox = listenerBoxes[i];
                if (listenerBox.once)
                    this.disconnect(listenerBox.listener, listenerBox.scope);

                listenerBox.listener.apply(listenerBox.scope, arguments);
            }
            this.listenersNeedCloning = false;
        },
        primitiveMatchesValueClass: function (primitive, valueClass) {
            if (typeof(primitive) == "string" && valueClass == String
                || typeof(primitive) == "number" && valueClass == Number
                || typeof(primitive) == "boolean" && valueClass == Boolean)
                return true;

            return false;
        },
        setValueClasses: function (valueClasses) {
            this._valueClasses = valueClasses || [];

            for (var i = this._valueClasses.length; i--;) {
                if (!(this._valueClasses[i] instanceof Function))
                    throw new Error('Invalid valueClasses argument: item at index ' + i
                    + ' should be a Class but was:<' + this._valueClasses[i] + '>.');
            }
        },
        registerListener: function (listener, scope, once) {
            for (var i = 0; i < this.listenerBoxes.length; i++) {
                if (this.listenerBoxes[i].listener == listener && this.listenerBoxes[i].scope == scope) {
                    if (this.listenerBoxes[i].once && !once) {
                        throw new Error('You cannot addOnce() then try to add() the same listener ' +
                        'without removing the relationship first.');
                    }
                    else if (once && !this.listenerBoxes[i].once) {
                        throw new Error('You cannot add() then addOnce() the same listener ' +
                        'without removing the relationship first.');
                    }
                    return;
                }
            }
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
            }

            this.listenerBoxes.push({listener: listener, scope: scope, once: once});
        }
    };


    

    /*
     <h2>DisplayList</h2>

     *
     */
    function DisplayList() {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        /*
         * <h3>MutationObserver</h3>
         * <p>provides developers a way to react to changes in a DOM.<br/>
         * It is designed as a replacement for Mutation Events defined in the DOM3 Events specification.</p>
         * <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">docs!</a>
         * */
        var observer = new MutationObserver(this.handleMutations.bind(this));

        /* <h3>Configuration of the observer.</h3>
         <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
         */
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
    }

    DisplayList.prototype = {
        handleMutations: function (mutations) {
            var response = mutations.reduce(function (result, mutation, index) {
                result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
                result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
                return result;
            }, {addedNodes: [], removedNodes: []});

            response.addedNodes.length && this.onAdded.emit(response.addedNodes);
            response.removedNodes.length && this.onRemoved.emit(response.removedNodes);
        }
    };
    

	/**
	 * <h2>Mediator</h2>
	 * <p>Mediators should observe one of the following forms:</p>
	 * <ul>
	 *     <li>Extend the base mediator class and override <code>initialize()</code> and, if needed, <code>destroy()</code>.</li>
	 *     <li>Don't extend the base mediator class, and provide functions <code>initialize()</code> and, if needed, also <code>destroy()</code>.</li>
	 * </ul>
	 *
	 * <p>A mediator that extends the Mediator might look like this:</p>
	 *
	 * <pre>
	 * var RoboJS=require("RoboJS");
	 * function MediatorA() {
     *    RoboJS.display.Mediator.apply(this, arguments);
     * }
	 * MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {
     *     initialize: {
     *         value: function () {
     *             // code goes here
     *        }
     *      }
     * });
	 *</pre>
	 *
	 *<p>You do not have to extend the Mediator:</p>
	 *
	 * <pre>
	 *
	 *    function MediatorA() {}
	 *
	 *    MediatorA.prototype={
     *        initialize:function(){
     *            //your code goes here
     *        }
     *    }
	 * </pre>
	 *
	 */
	function Mediator(eventDispatcher, eventMap) {

		this.eventMap = eventMap;//new EventMap();
		this.eventDispatcher = eventDispatcher; //EventDispatcher.getInstance();
	}

	Mediator.inherit = function (scope, args) {

		Mediator.apply(scope,Array.prototype.slice.call(args,-2));
	};
	Mediator.prototype = {
		/**
		 * <h3>postDestroy</h3>
		 * <p>Runs after the mediator has been destroyed.
		 * Cleans up listeners mapped through the local <code>eventMap</code>.</p>
		 */
		postDestroy: function () {
			console.log("postDestroy");
			this.eventMap.unmapListeners();
		},
		/**
		 * <h3>addContextListener</h3>
		 * <p>Syntactical sugar for mapping a listener to an <code>EventDispatcher</code></p>
		 * @param eventString <code>String</code>
		 * @param listener <code>Function</code>
		 * @param scope <code>*</code> the context where 'this' is bind to
		 */
		addContextListener: function (eventString, listener, scope) {
			this.eventMap.mapListener(this.eventDispatcher, eventString, listener, scope);
		},
		/**
		 *<h3>removeContextListener</h3>
		 * <p>Syntactical sugar for unmapping a listener to an <code>EventDispatcher</code></p>
		 * @param eventString <code>String</code>
		 * @param listener <code>Function</code>
		 */
		removeContextListener: function (eventString, listener) {
			this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
		},
		/**
		 *<h3>dispatch</h3>
		 *
		 * <p>Dispatch helper method</p>
		 * @param eventString <code>String</code> The Event name to dispatch on the system
		 * @param data <code>*</code> the data dispatched
		 */
		dispatch: function (eventString, data) {
			if (this.eventDispatcher.hasEventListener(eventString)) {
				this.eventDispatcher.dispatchEvent(eventString, data);
			}
		},
		/**
		 * <h3>initialize</h3>
		 * Initializes the mediator. This is run automatically by the <code>mediatorBuilder</code> when a mediator is created.
		 * Normally the <code>initialize</code> function is where you would add handlers using the <code>eventMap</code>.
		 */
		initialize: function (node) {
			this.element = node;
		},
		/**
		 * <h3>destroy</h3>
		 * Destroys the mediator. This is run automatically by the <code>mediatorBuilder</code> when a mediator is destroyed.
		 * You should clean up any handlers that were added directly (<code>eventMap</code> handlers will be cleaned up automatically).
		 */
		destroy: function () {}
	};
	

    /*
     <h2>MediatorsBuilder</h2>
     */
    function MediatorsBuilder(displayList, scriptLoader,mediatorHandler, definitions) {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        this.definitions = definitions || [];
        this.displayList = displayList;
        this.mediatorHandler = mediatorHandler;
        this.displayList.onAdded.connect(this._handleNodesAdded, this);
        this.displayList.onRemoved.connect(this._handleNodesRemoved, this);
        this.loader = scriptLoader;
    }


    MediatorsBuilder.prototype = {

        bootstrap: function () {

            return this.getMediators([document.body]);
        },
        getMediators: function (target) {
            return Promise.all(target
                .reduce(this._reduceNodes, [])
                .reduce(this._findMediators.bind(this), []));
        },
        _findMediators: function (result, node) {
            return result.concat(this.definitions
                .filter(function (def) {
                    return node.dataset && node.dataset.mediator == def.id;
                })
                .map(function (def) {
                    return this.loader.get(def.mediator).then(this._initMediator.bind(this, node));
                }.bind(this)));

        },
        _initMediator: function (node, Mediator) {
	        return this.mediatorHandler.create(node, Mediator);

        },
        _handleNodesAdded: function (nodes) {
            this.getMediators(nodes).then(function (mediators) {
                if (mediators.length) {
                    this.onAdded.emit(mediators);
                }
            }.bind(this));
        },
        _handleNodesRemoved: function (nodes) {
            nodes.reduce(this._reduceNodes, [])
                .forEach(this._destroyMediator.bind(this));

        },
        _reduceNodes: function (result, node) {
            if (!node || !node.getElementsByTagName)return result;
            var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
        _destroyMediator: function (node) {
	        var mediator = this.mediatorHandler.destroy(node);
	        mediator &&  this.onRemoved.emit(mediator);


        }
    };
    

   /*
   <h2>ScriptLoader</h2>
    */
    function ScriptLoader() {
    }

    ScriptLoader.prototype = {
        get: function (id) {
            return new Promise(function (resolve, reject) {
                require([id], function (Mediator) {
                    resolve(Mediator);
                });
            });
        }
    };
    

    /*
     * <h2><strong>EventDispatcher</strong></h2>
     * <p>The EventDispatcher class is a Singleton that handle Events in RoboJS.<br/>
     * It can also be used as the base class for all classes that dispatch events.</p>
     * */
    function EventDispatcher() {
        this._currentListeners = {};
    }

    EventDispatcher.prototype = {
        /**
         * <h3>addEventListener</h3>
         * <p>Registers an event listener object with an EventDispatcher object so that the listener receives notification of an event.</p>
         * @param type <code>String</code> the event name to listen
         * @param callback <code>Function</code> the callback to execute
         * @param scope <code>Object</code> the scope of the callback (default=null)
         * @returns <code>Object</code> the listener added
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
         *<h3>removeEventListener</h3>
         * <p>Removes a listener from the EventDispatcher object.</p>
         * @param eventName <code>String</code> the event name to remove
         * @param callback <code>Function</code> the callback to unmap
         * @param scope <code>Object</code> the scope of the callback
         */
        removeEventListener: function (eventName, callback, scope) {
            var listeners = this._currentListeners[eventName] || [];
            this._currentListeners[eventName] = listeners.filter(function (listener) {
                var sameCB = listener.callback == callback;
                var sameScope = listener.scope == scope;
                return !(sameCB && sameScope);
            });
        },
        /**
         *<h3>removeAllEventListeners</h3>
         * <p>Removes all listeners from the EventDispatcher object.</p>
         * @param eventName <code>String</code> the event name to remove
         */
        removeAllEventListeners: function (eventName) {
            this._currentListeners[eventName] = null;
        },
        /**
         *<h3>hasEventListener</h3>
         * <p>Checks whether the EventDispatcher object has any listeners registered for a specific type of event.</p>
         * @param eventName <code>String</code> the event to check
         * @returns <code>*</code>
         */
        hasEventListener: function (eventName) {
            return this._currentListeners[eventName] && this._currentListeners[eventName].length
        },
        /**
         *<h3>dispatchEvent</h3>
         * <p>Dispatches an event into the event flow.</p>
         * @param type <code>String</code> the event to dispatch
         * @param data <code>*</code> the data to pass
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
    EventDispatcher.__instance = null;
    /**
     * <h3>getInstance</h3>
     * <p>static method to get Singleton instance</p>
     * @returns <code>EventDispatcher</code>
     */
    EventDispatcher.getInstance = function () {

        if (!EventDispatcher.__instance) {
            EventDispatcher.__instance = new EventDispatcher();
        }
        return EventDispatcher.__instance;
    };
    

/*
 <h2>EventMapConfig</h2>
 */
    function EventMapConfig(dispatcher, eventString, listener, callback, scope) {
        this.dispatcher = dispatcher;
        this.eventString = eventString;
        this.listener = listener;
        this.callback = callback;
        this.scope = scope;
    }

    EventMapConfig.prototype = {
        equalTo: function (dispatcher, eventString, listener) {
            return this.eventString == eventString
                && this.dispatcher == dispatcher
                && this.listener == listener;

        }
    };
    


    /**
     * <h2><strong>EventMap</strong></h2>
     * <p>The Event Map keeps track of listeners and provides the ability
     * to unregister all listeners with a single method call.</p>
     */
    function EventMap() {
        this._listeners = [];

    }

    EventMap.prototype = {
        /**
          <h3>mapListener</h3>
        * <p>The same as calling addEventListener directly on the EventDispatcher, but keeps a list of listeners for easy (usually automatic) removal.</p>
        * @param dispatcher <code>EventDispatcher</code> -- The EventDispatcher to listen to
         *@param eventString <code>String</code> -- The Event type to listen for
         *@param listener <code>Function</code> -- The Event handler
         *@param scope <code>*</code> -- the listener scope (default = null)
        */
        mapListener: function (dispatcher, eventString, listener, scope) {
            var currentListeners = this._listeners;

            var config;
            var i = currentListeners.length;
            while (i--) {
                config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {
                    return;
                }
            }
            var callback = listener;

            config = new EventMapConfig(dispatcher, eventString, listener, callback, scope);

            currentListeners.push(config);
            dispatcher.addEventListener(eventString, callback, scope);

        },
        /**
         * <h3>unmapListener</h3>
         * <p>The same as calling <code>removeEventListener</code> directly on the <code>EventDispatcher</code>,
         * but updates our local list of listeners.</p>
         *
         * @param dispatcher The <code>EventDispatcher</code>
         * @param eventString The <code>String</code> type
         * @param listener The <code>Function</code> handler

         */
        unmapListener: function (dispatcher, eventString, listener) {
            var currentListeners = this._listeners;

            var i = currentListeners.length;
            while (i--) {
                var config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {

                    dispatcher.removeEventListener(eventString, config.callback, config.scope);

                    currentListeners.splice(i, 1);
                    return;
                }
            }
        },
        /**
         * <h3>unmapListeners</h3>
         * <p>Removes all listeners registered through <code>mapListener</code></p>
         */
        unmapListeners: function () {
            var currentListeners = this._listeners;

            var eventConfig;
            var dispatcher;
            while (eventConfig = currentListeners.pop()) {

                dispatcher = eventConfig.dispatcher;
                dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);

            }
        }
    };
    
/**
 * Created by marco.gobbi on 21/01/2015.
 */

	"use strict";


	function MediatorHandler() {
	}

	MediatorHandler.prototype = {
		create: function (node, Mediator) {
			var mediatorId = RoboJS.utils.nextUid();
			node.dataset = node.dataset || {};
			node.dataset.mediatorId = mediatorId;
			//
			var _mediator = new Mediator(EventDispatcher.getInstance(), new EventMap());
			_mediator.id = mediatorId;
			RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
			_mediator.initialize(node);
			return _mediator;
		},
		destroy: function (node) {
			var mediatorId = node.dataset && node.dataset.mediatorId;
			var mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
			if (mediator) {
				mediator.destroy && mediator.destroy();
				mediator.postDestroy && mediator.postDestroy();
				mediator.element && (mediator.element = null);
				RoboJS.MEDIATORS_CACHE[mediatorId] = null;
				mediator = null;
			}
		}
	};
	
/**
 * Created by marco.gobbi on 21/01/2015.
 */
define('org/display/bootstrap',[
	"./DisplayList",
	"./MediatorsBuilder",
	"../net/ScriptLoader",
	"./MediatorHandler"
], function (DisplayList, MediatorsBuilder, ScriptLoader, MediatorHandler) {
	"use strict";
	//reduce dependencies of outside code on the inner workings of a library
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
	};
	return bootstrap;
});

/*

* <strong>RoboJS.display</strong> package contains
* <ul>
*     <li>DisplayList</li>
*     <li>Mediator</li>
*     <li>MediatorsFacade</li>
*     <li>MediatorBuilder</li>
* </ul>
*
* */
    RoboJS.display = {
        DisplayList: DisplayList,
        Mediator: Mediator,
	    bootstrap: bootstrap,
        MediatorsBuilder: MediatorsBuilder
    };




    /*

     * <strong>RoboJS.events</strong> package contains
     * <ul>
     *     <li>EventDispatcher</li>
     *     <li>EventMap</li>
     *     <li>EventMapConfig</li>
     *     <li>Signal</li>
     * </ul>
     *
     * */
    RoboJS.events = {
        EventDispatcher: EventDispatcher,
        EventMap: EventMap,
        EventMapConfig: EventMapConfig,
        Signal: Signal
    };



    /*
     * <strong>RoboJS.net</strong> package contains
     * <ul>
     *     <li>ScriptLoader</li>
     * </ul>
     *
     * */
    RoboJS.net = {
        ScriptLoader: ScriptLoader
    };


;





return RoboJS;
}));