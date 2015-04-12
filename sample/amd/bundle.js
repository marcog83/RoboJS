(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.robojs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ScriptLoader = require("./net/ScriptLoader");

var _ScriptLoader2 = _interopRequireWildcard(_ScriptLoader);

var _EventMap = require("./events/EventMap");

var _EventMap2 = _interopRequireWildcard(_EventMap);

var _EventDispatcher = require("./events/EventDispatcher");

var _EventDispatcher2 = _interopRequireWildcard(_EventDispatcher);

var _Signal = require("./events/Signal");

var _Signal2 = _interopRequireWildcard(_Signal);

var _DisplayList = require("./display/DisplayList");

var _DisplayList2 = _interopRequireWildcard(_DisplayList);

var _Mediator = require("./display/Mediator");

var _Mediator2 = _interopRequireWildcard(_Mediator);

var _MediatorsBuilder = require("./display/MediatorsBuilder");

var _MediatorsBuilder2 = _interopRequireWildcard(_MediatorsBuilder);

var _bootstrap = require("./display/bootstrap");

var _bootstrap2 = _interopRequireWildcard(_bootstrap);

var _MediatorHandler = require("./display/MediatorHandler");

var _MediatorHandler2 = _interopRequireWildcard(_MediatorHandler);

var uid = ["0", "0", "0"];
function nextUid() {
    "use strict";
    var index = uid.length;
    var digit = undefined;
    while (index) {
        index--;
        digit = uid[index].charCodeAt(0);
        if (digit == 57 /*'9'*/) {
            uid[index] = "A";
            return uid.join("");
        }
        if (digit == 90 /*'Z'*/) {
            uid[index] = "0";
        } else {
            uid[index] = String.fromCharCode(digit + 1);
            return uid.join("");
        }
    }
    uid.unshift("0");
    return uid.join("");
}
var flip = function flip(f) {
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return f.apply(undefined, args.reverse());
    };
};

var RoboJS = {
    MEDIATORS_CACHE: {},
    utils: {
        uid: uid,
        nextUid: nextUid,
        flip: flip
    }
};

RoboJS.display = {
    DisplayList: _DisplayList2["default"],
    Mediator: _Mediator2["default"],
    bootstrap: _bootstrap2["default"],
    MediatorHandler: _MediatorHandler2["default"],
    MediatorsBuilder: _MediatorsBuilder2["default"]
};

RoboJS.events = {
    EventDispatcher: _EventDispatcher2["default"],
    EventMap: _EventMap2["default"],
    Signal: _Signal2["default"]
};

RoboJS.net = {
    ScriptLoader: _ScriptLoader2["default"]
};
exports["default"] = RoboJS;
module.exports = exports["default"];

},{"./display/DisplayList":2,"./display/Mediator":3,"./display/MediatorHandler":4,"./display/MediatorsBuilder":5,"./display/bootstrap":6,"./events/EventDispatcher":7,"./events/EventMap":8,"./events/Signal":9,"./net/ScriptLoader":10}],2:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = DisplayList;

var _Signal = require("../events/Signal");

var _Signal2 = _interopRequireWildcard(_Signal);

function DisplayList() {
    var onAdded = _Signal2["default"]();
    var onRemoved = _Signal2["default"]();

    var handleMutations = function handleMutations(mutations) {
        var response = mutations.reduce(function (result, mutation) {
            result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
            result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
            return result;
        }, { addedNodes: [], removedNodes: [] });

        response.addedNodes.length && onAdded.emit(response.addedNodes);
        response.removedNodes.length && onRemoved.emit(response.removedNodes);
    };
    var observer = new MutationObserver(handleMutations);

    /* <h3>Configuration of the observer.</h3>
     <p>Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.</p>
     */
    observer.observe(document.body, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: true
    });
    return {
        onAdded: onAdded,
        onRemoved: onRemoved
    };
}

;
module.exports = exports["default"];

},{"../events/Signal":9}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = Mediator;

function Mediator(eventDispatcher, eventMap) {

    var element = undefined;
    var postDestroy = function postDestroy() {
        return eventMap.unmapListeners();
    };
    var addContextListener = function addContextListener(eventString, listener, scope) {
        return eventMap.mapListener(eventDispatcher, eventString, listener, scope);
    };
    var removeContextListener = function removeContextListener(eventString, listener) {
        return eventMap.unmapListener(eventDispatcher, eventString, listener);
    };
    var dispatch = function dispatch(eventString, data) {
        if (eventDispatcher.hasEventListener(eventString)) {
            eventDispatcher.dispatchEvent(eventString, data);
        }
    };
    var initialize = function initialize(node) {
        return element = node;
    };
    return {

        postDestroy: postDestroy,
        addContextListener: addContextListener,
        removeContextListener: removeContextListener,
        dispatch: dispatch,
        initialize: initialize

    };
}

module.exports = exports["default"];

},{}],4:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Created by marco.gobbi on 21/01/2015.
 */

var _RoboJS = require("../core");

var _RoboJS2 = _interopRequireWildcard(_RoboJS);

var _EventDispatcher = require("../events/EventDispatcher");

var _EventDispatcher2 = _interopRequireWildcard(_EventDispatcher);

var _EventMap = require("../events/EventMap");

var _EventMap2 = _interopRequireWildcard(_EventMap);

exports["default"] = {
    create: function create(node, def, Mediator) {
        var mediatorId = _RoboJS2["default"].utils.nextUid();
        //node.dataset = node.dataset || {};
        node.setAttribute("mediatorId", mediatorId);
        //node.dataset.mediatorId = mediatorId;
        //
        var _mediator = Mediator(_EventDispatcher2["default"], _EventMap2["default"]());
        _mediator.id = mediatorId;
        _RoboJS2["default"].MEDIATORS_CACHE[mediatorId] = _mediator;
        _mediator.initialize(node);
        return _mediator;
    },
    destroy: function destroy(node) {

        var mediatorId = node.getAttribute("mediatorId"); //&& node.dataset.mediatorId;
        var mediator = _RoboJS2["default"].MEDIATORS_CACHE[mediatorId];
        if (mediator) {
            mediator.destroy && mediator.destroy();
            mediator.postDestroy && mediator.postDestroy();
            mediator.element && (mediator.element = null);
            _RoboJS2["default"].MEDIATORS_CACHE[mediatorId] = null;
            mediator = null;
        }
    }
};
module.exports = exports["default"];

},{"../core":1,"../events/EventDispatcher":7,"../events/EventMap":8}],5:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = MediatorsBuilder;

var _RoboJS = require("../core");

var _RoboJS2 = _interopRequireWildcard(_RoboJS);

var _Signal = require("../events/Signal");

var _Signal2 = _interopRequireWildcard(_Signal);

function MediatorsBuilder(displayList, loader, mediatorHandler, definitions) {
    var onAdded = _Signal2["default"](),
        onRemoved = _Signal2["default"](),
        _emitAddedSignal = function _emitAddedSignal(mediators) {
        if (mediators.length) onAdded.emit(mediators);
    },
        _filterDefinitions = function _filterDefinitions(node, def) {
        return node.getAttribute("data-mediator") == def.id;
    },
        _createMediator = function _createMediator(node, def) {
        return loader.load(def.mediator).then(mediatorHandler.create.bind(null, node, def));
    },
        _findMediators = function _findMediators(result, node) {
        return result.concat(definitions.filter(_filterDefinitions.bind(null, node)).map(_createMediator.bind(null, node)));
    },
        _reduceNodes = function _reduceNodes(result, node) {
        if (!node || !node.getElementsByTagName) {
            return result;
        }var n = [].slice.call(node.getElementsByTagName("*"), 0);
        n.unshift(node);
        return result.concat(n);
    },
        _destroyMediator = function _destroyMediator(node) {
        var mediator = mediatorHandler.destroy(node);
        mediator && onRemoved.emit(mediator);
    },
        getMediators = function getMediators(target) {
        return Promise.all(target.reduce(_reduceNodes, []).reduce(_findMediators, []));
    },
        _handleNodesAdded = function _handleNodesAdded(nodes) {
        return getMediators(nodes).then(_emitAddedSignal);
    },
        _handleNodesRemoved = function _handleNodesRemoved(nodes) {
        return nodes.reduce(_reduceNodes, []).forEach(_destroyMediator);
    };

    displayList.onAdded.connect(_handleNodesAdded);
    displayList.onRemoved.connect(_handleNodesRemoved);

    return {
        onAdded: onAdded,
        onRemoved: onRemoved,
        bootstrap: function bootstrap() {
            return getMediators([document.body]);
        }
    };
}

module.exports = exports["default"];

},{"../core":1,"../events/Signal":9}],6:[function(require,module,exports){
"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = bootstrap;
/**
 * Created by marco.gobbi on 21/01/2015.
 */

var _MediatorsBuilder = require("./MediatorsBuilder");

var _MediatorsBuilder2 = _interopRequireWildcard(_MediatorsBuilder);

var _DisplayList = require("./DisplayList");

var _DisplayList2 = _interopRequireWildcard(_DisplayList);

var _ScriptLoader = require("../net/ScriptLoader");

var _ScriptLoader2 = _interopRequireWildcard(_ScriptLoader);

var _MediatorHandler = require("./MediatorHandler");

var _MediatorHandler2 = _interopRequireWildcard(_MediatorHandler);

function bootstrap(config) {
  var definitions = config.definitions;
  var _config$autoplay = config.autoplay;
  var autoplay = _config$autoplay === undefined ? true : _config$autoplay;
  var _config$domWatcher = config.domWatcher;
  var domWatcher = _config$domWatcher === undefined ? _DisplayList2["default"]() : _config$domWatcher;
  var _config$scriptLoader = config.scriptLoader;
  var scriptLoader = _config$scriptLoader === undefined ? _ScriptLoader2["default"] : _config$scriptLoader;
  var _config$mediatorHandler = config.mediatorHandler;
  var mediatorHandler = _config$mediatorHandler === undefined ? _MediatorHandler2["default"] : _config$mediatorHandler;

  /*var displayList =config.domWatcher || DisplayList(),
   scriptLoader =config.scriptLoader || ScriptLoader,
   mediatorHandler =config.mediatorHandler || MediatorHandler;*/
  /**
   * get the mediators and return a promise.
   * The promise argument is an Array of Mediator instances
   */
  var builder = _MediatorsBuilder2["default"](domWatcher, scriptLoader, mediatorHandler, definitions);
  return autoplay ? builder.bootstrap() : builder;
}

;
module.exports = exports["default"];

},{"../net/ScriptLoader":10,"./DisplayList":2,"./MediatorHandler":4,"./MediatorsBuilder":5}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function EventDispatcher() {

    var _currentListeners = {};

    function addEventListener(type, callback, scope) {
        var listener = {
            type: type,
            callback: callback,
            scope: scope
        };
        if (!_currentListeners[type]) {
            _currentListeners[type] = [];
        }
        _currentListeners[type].push(listener);
        return listener;
    }

    function removeEventListener(eventName, callback, scope) {
        var listeners = _currentListeners[eventName] || [];
        _currentListeners[eventName] = listeners.filter(function (listener) {
            var sameCB = listener.callback == callback;
            var sameScope = listener.scope == scope;
            return !(sameCB && sameScope);
        });
    }

    var removeAllEventListeners = function removeAllEventListeners(eventName) {
        return _currentListeners[eventName] = null;
    };
    var hasEventListener = function hasEventListener(eventName) {
        return _currentListeners[eventName] && _currentListeners[eventName].length;
    };

    function dispatchEvent(type, data) {
        var listeners = _currentListeners[type] || [];
        var length = listeners.length,
            l = undefined,
            c = undefined,
            s = undefined;
        for (var i = 0; i < length; i++) {
            l = listeners[i];
            c = l.callback;
            s = l.scope;
            c.call(s, data);
        }
    }
    return {
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        removeAllEventListeners: removeAllEventListeners,
        hasEventListener: hasEventListener,
        dispatchEvent: dispatchEvent
    };
};
exports["default"] = EventDispatcher();
module.exports = exports["default"];

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = EventMap;

function EventMap() {
    var currentListeners = [];
    return {

        mapListener: function mapListener(dispatcher, eventString, listener, scope) {
            var _this = this;

            var config = undefined;
            var i = currentListeners.length;
            while (i--) {
                config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {
                    return;
                }
            }
            var callback = listener;

            config = {
                dispatcher: dispatcher,
                eventString: eventString,
                listener: listener,
                callback: callback,
                scope: scope,
                equalTo: function equalTo(dispatcher, eventString, listener) {
                    return _this.eventString == eventString && _this.dispatcher == dispatcher && _this.listener == listener;
                }
            };

            currentListeners.push(config);
            dispatcher.addEventListener(eventString, callback, scope);
        },

        unmapListener: function unmapListener(dispatcher, eventString, listener) {

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

        unmapListeners: function unmapListeners() {

            var eventConfig = undefined;
            var dispatcher = undefined;
            while (eventConfig = currentListeners.pop()) {

                dispatcher = eventConfig.dispatcher;
                dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);
            }
        }
    };
}

module.exports = exports["default"];

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = Signal;

function Signal() {

    var listenerBoxes = [];

    function registerListener(listener, scope, once) {
        for (var i = 0; i < listenerBoxes.length; i++) {
            if (listenerBoxes[i].listener == listener && listenerBoxes[i].scope == scope) {
                if (listenerBoxes[i].once && !once) {
                    throw new Error('You cannot addOnce() then try to add() the same listener ' + 'without removing the relationship first.');
                } else if (once && !listenerBoxes[i].once) {
                    throw new Error('You cannot add() then addOnce() the same listener ' + 'without removing the relationship first.');
                }
                return;
            }
        }

        listenerBoxes.push({ listener: listener, scope: scope, once: once });
    }

    function emit() {

        // var listenerBoxes = listenerBoxes;
        var len = listenerBoxes.length;
        var listenerBox = undefined;

        for (var i = 0; i < len; i++) {
            listenerBox = listenerBoxes[i];
            if (listenerBox.once) disconnect(listenerBox.listener, listenerBox.scope);

            listenerBox.listener.apply(listenerBox.scope, arguments);
        }
    }

    var connect = function connect(slot, scope) {
        return registerListener(slot, scope, false);
    };

    var connectOnce = function connectOnce(slot, scope) {
        return registerListener(slot, scope, true);
    };

    function disconnect(slot, scope) {

        for (var i = listenerBoxes.length; i--;) {
            if (listenerBoxes[i].listener == slot && listenerBoxes[i].scope == scope) {
                listenerBoxes.splice(i, 1);
                return;
            }
        }
    }

    function disconnectAll() {

        for (var i = listenerBoxes.length; i--;) {
            disconnect(listenerBoxes[i].listener, listenerBoxes[i].scope);
        }
    }

    return {
        connect: connect,
        connectOnce: connectOnce,
        disconnect: disconnect,
        disconnectAll: disconnectAll,
        emit: emit

    };
}

module.exports = exports['default'];

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
//var System = require('es6-module-loader').System;
exports["default"] = {
    load: function load(id) {
        return new Promise(function (resolve, reject) {
            window.require([id], function (Mediator) {
                resolve(Mediator);
            });
        });
    }
};
module.exports = exports["default"];

},{}]},{},[1])(1)
});