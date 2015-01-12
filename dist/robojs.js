/*
 RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
 Add a node to the DOM and a JS will be loaded!
 Remove a node and the JS will be disposed!!
 */
(function (root, factory) {
	// Uses AMD or browser globals to create a module.
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lodash',"signals","Promise"], factory);
	} else {
		// Browser globals
		root.RoboJS = factory(root._,root.signals,root.Promise);
	}
}(this, function (_,signals,Promise) {
	'use strict';

   //this is the core Object that contains all packages.
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
    


     function DisplayList() {
        this.onAdded = new signals.Signal();
        this.onRemoved = new signals.Signal();
       /*
       * <strong>MutationObserver</strong><br/> provides developers a way to react to changes in a DOM.<br/>
        * It is designed as a replacement for Mutation Events defined in the DOM3 Events specification.
        * <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">docs!</a>
       * */
        var observer = new MutationObserver(this.handleMutations.bind(this));

        /* <strong>Configuration of the observer.</strong><br/>
         Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.
        */
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree:true
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
    

    /*
     * <strong>EventDispatcher</strong>
     * <p>The EventDispatcher class is a Singleton that handle Events in RoboJS.<br/>
     * It can also be used as the base class for all classes that dispatch events.</p>
     * */
    function EventDispatcher() {
        this._currentListeners = {};
    }

    EventDispatcher.prototype = {
        /**
         *<strong>addEventListener</strong>
         * @param type {String} the event name to listen
         * @param callback {Function} the callback to execute
         * @param scope {Object | null} the scope of the callback
         * @returns {Object} the listener added
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
         *<strong>removeEventListener</strong>
         * @param eventName {String} the event name to remove
         * @param callback {Function} the callback to unmap
         * @param scope {Object | null} the scope of the callback
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
         *<strong>removeAllEventListeners</strong>
         * @param eventName {String} the event name to remove
         */
        removeAllEventListeners: function (eventName) {
            this._currentListeners[eventName] = null;
        },
        /**
         *<strong>hasEventListener</strong>
         * @param eventName {String} the event to check
         * @returns {*}
         */
        hasEventListener: function (eventName) {
            return this._currentListeners[eventName] && this._currentListeners[eventName].length
        },
        /**
         *<strong>dispatchEvent</strong>
         * @param type {String} the event to dispatch
         * @param data {*} the data to pass
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
    EventDispatcher.getInstance = function () {

        if (!EventDispatcher.__instance) {
            EventDispatcher.__instance = new EventDispatcher();
        }
        return EventDispatcher.__instance;
    };
    


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
     * <strong>EventMap</strong>
     * <p>The Event Map keeps track of listeners and provides the ability
     * to unregister all listeners with a single method call.</p>
     */
    function EventMap() {
        this._listeners = [];

    }

    EventMap.prototype = {
        /**
          <strong>mapListener</strong>
        * <p>The same as calling addEventListener directly on the EventDispatcher, but keeps a list of listeners for easy (usually automatic) removal.</p>
        * @param dispatcher {EventDispatcher} -- The EventDispatcher to listen to
         *@param eventString {String} -- The Event type to listen for
         *@param listener {Function} -- The Event handler
         *@param scope {*} -- the listener scope (default = null)
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
         * <strong>unmapListener</strong>
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
         * Removes all listeners registered through <code>mapListener</code>
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
     * <strong>Mediator</strong>
     * <p>Mediators should observe one of the following forms:</p>
     * <ul>
     *     <li>Extend the base mediator class and override <i>initialize()</i> and, if needed, <i>destroy</i>.</li>
     *     <li>Don't extend the base mediator class, and provide functions <i>initialize()</i> and, if needed, also <i>destroy()</i>.</li>
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
    function Mediator(element) {
        this.element = element;
        this.eventMap = new EventMap();
        this.eventDispatcher = EventDispatcher.getInstance();
    }

    Mediator.prototype = {
        /**
         * <strong>postDestroy</strong>
         * <p>Runs after the mediator has been destroyed.
         * Cleans up listeners mapped through the local EventMap.</p>
         */
        postDestroy: function () {
            console.log("postDestroy");
            this.eventMap.unmapListeners();
        },
        /**
         * <strong>addContextListener</strong>
         * <p>Syntactical sugar for mapping a listener to an EventDispatcher</p>
         * @param eventString {string}
         * @param listener {function}
         * @param scope {*} the context where 'this' is bind to
         */
        addContextListener: function (eventString, listener, scope) {
            this.eventMap.mapListener(this.eventDispatcher, eventString, listener, scope);
        },
        /**
         *<strong>removeContextListener</strong>
         * <p>Syntactical sugar for unmapping a listener to an EventDispatcher</p>
         * @param eventString {string}
         * @param listener {function}
         */
        removeContextListener: function (eventString, listener) {
            this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
        },
        /**
         *<strong>dispatch</strong>
         *
         * <p>Dispatch helper method</p>
         * @param eventString {string} The Event name to dispatch on the system
         * @param data {*} the data dispatched
         */
        dispatch: function (eventString, data) {
            if (this.eventDispatcher.hasEventListener(eventString)) {
                this.eventDispatcher.dispatchEvent(eventString, data);
            }
        },
        initialize: function () {},
        destroy: function () {}
    };
    

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
    


    function MediatorsBuilder(_definition) {
        this.onAdded = new signals.Signal();
        this.onRemoved = new signals.Signal();
        this.definitions = _definition || [];
        this.displayList = new DisplayList();
        this.displayList.onAdded.add(this._handleNodesAdded, this);
        this.displayList.onRemoved.add(this._handleNodesRemoved, this);
        // by default ScriptLoader is how you will load external scripts.
        this.loader = new ScriptLoader();
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


            // filter definitions based on actual Node
            // once you get the Mediators you need, load the specific script.
            var mediators = _.chain(this.definitions)
                .filter(function (def) {
                    return node.dataset && node.dataset.mediator == def.id;
                })
                .map(function (def) {
                    // prefill _initMediator with node parameter
                    return this.loader.get(def.mediator).then(this._initMediator.bind(this, node));
                }.bind(this)).value();
            // add mediators promise to the result Array
            return result.concat(mediators);
        },
        _initMediator: function (node, Mediator) {
            var mediatorId = RoboJS.utils.nextUid();
            node.dataset = node.dataset || {};
            node.dataset.mediatorId = mediatorId;
            var _mediator = new Mediator(node);
            _mediator.id = mediatorId;
            RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
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

            _.chain(nodes)
                .reduce(this._reduceNodes, [])
                .forEach(this._destroyMediator.bind(this))
        },
        _reduceNodes: function (result, node) {
            if (!node || !node.getElementsByTagName)return result;
            var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
        _destroyMediator: function (node) {
            var mediatorId = node.dataset && node.dataset.mediatorId;
            var mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
            if (mediator) {
                mediator.destroy && mediator.destroy();
                mediator.postDestroy && mediator.postDestroy();

                this.onRemoved.dispatch(mediator);
                mediator.element && (mediator.element = null);
                RoboJS.MEDIATORS_CACHE[mediatorId] = null;
                mediator = null;
            }

        }
    };
    

/*

* <strong>RoboJS.display</strong> package contains
* <ul>
*     <li>DisplayList</li>
*     <li>Mediator</li>
*     <li>MediatorBuilder</li>
* </ul>
*
* */
    RoboJS.display = {
        DisplayList: DisplayList,
        Mediator: Mediator,
        MediatorsBuilder: MediatorsBuilder
    };




    /*

     * <strong>RoboJS.events</strong> package contains
     * <ul>
     *     <li>EventDispatcher</li>
     *     <li>EventMap</li>
     *     <li>EventMapConfig</li>
     * </ul>
     *
     * */
    RoboJS.events = {
        EventDispatcher: EventDispatcher,
        EventMap: EventMap,
        EventMapConfig: EventMapConfig
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