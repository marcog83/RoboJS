(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define("robojs", ["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.robojs = mod.exports;
    }
})(this, function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    function __extends(d, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) d[p] = b[p];
        }function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var Loader = function () {
        function Loader() {}
        Loader.prototype.load = function (id) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                return _this.onComplete(id, resolve, reject);
            });
        };
        Loader.prototype.onComplete = function (id, resolve, reject) {};
        return Loader;
    }();
    var AMDLoader = function (_super) {
        __extends(AMDLoader, _super);
        function AMDLoader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AMDLoader.prototype.onComplete = function (id, resolve, reject) {
            require([id], resolve, reject);
        };
        return AMDLoader;
    }(Loader);
    var CustomLoader = function (_super) {
        __extends(CustomLoader, _super);
        function CustomLoader(fn) {
            var _this = _super.call(this) || this;
            _this.fn = fn;
            return _this;
        }
        CustomLoader.prototype.onComplete = function (id, resolve, reject) {
            this.fn(id, resolve, reject);
        };
        return CustomLoader;
    }(Loader);

    var EventTarget = function () {
        function EventTarget() {
            this.listeners_ = {};
        }
        EventTarget.prototype.addEventListener = function (type, handler) {
            if (!(type in this.listeners_)) {
                this.listeners_[type] = [handler];
            } else {
                var handlers = this.listeners_[type];
                if (handlers.indexOf(handler) < 0) {
                    handlers.push(handler);
                }
            }
        };
        EventTarget.prototype.removeEventListener = function (type, handler) {
            if (type in this.listeners_) {
                var handlers = this.listeners_[type];
                var index = handlers.indexOf(handler);
                if (index >= 0) {
                    if (handlers.length === 1) {
                        delete this.listeners_[type];
                    } else {
                        handlers.splice(index, 1);
                    }
                }
            }
        };
        EventTarget.prototype.dispatchEvent = function (event) {
            var self = this;
            event.__defineGetter__("target", function () {
                return self;
            });
            var type = event.type;
            var prevented = 0;
            if (type in this.listeners_) {
                var handlers = this.listeners_[type].concat();
                for (var i = 0; i < handlers.length; i++) {
                    var handler = handlers[i];
                    if (handler.handleEvent) {
                        prevented |= handler.handleEvent.call(handler, event) === false;
                    } else {
                        prevented |= handler.call(this, event) === false;
                    }
                }
            }
            return !prevented && !event.defaultPrevented;
        };
        return EventTarget;
    }();
    var G = (typeof global === "undefined" ? "undefined" : _typeof(global)) === _typeof(null) ? global : self;
    var _EventTarget = G.EventTarget;
    try {
        new _EventTarget();
    } catch (e) {
        _EventTarget = EventTarget;
    }
    var EventTarget$1 = _EventTarget;

    var Signal = function () {
        function Signal() {
            this.listenerBoxes = [];
            this.listenersNeedCloning = false;
        }
        Signal.prototype.getNumListeners = function () {
            return this.listenerBoxes.length;
        };
        Signal.prototype.connect = function (slot, scope) {
            this.registerListener(slot, scope, false);
        };
        Signal.prototype.connectOnce = function (slot, scope) {
            this.registerListener(slot, scope, true);
        };
        Signal.prototype.disconnect = function (slot, scope) {
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
        };
        Signal.prototype.disconnectAll = function () {
            for (var i = this.listenerBoxes.length; i--;) {
                this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        };
        Signal.prototype.emit = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.listenersNeedCloning = true;
            this.listenerBoxes.forEach(function (_a) {
                var scope = _a.scope,
                    listener = _a.listener,
                    once = _a.once;
                if (once) {
                    _this.disconnect(listener, scope);
                }
                listener.apply(scope, args);
            });
            this.listenersNeedCloning = false;
        };
        Signal.prototype.registerListener = function (listener, scope, once) {
            var _listeners = this.listenerBoxes.filter(function (box) {
                return box.listener === listener && box.scope === scope;
            });
            if (!_listeners.length) {
                if (this.listenersNeedCloning) {
                    this.listenerBoxes = this.listenerBoxes.slice();
                }
                this.listenerBoxes.push({ listener: listener, scope: scope, once: once });
            } else {
                var addOnce_add = _listeners.find(function (box) {
                    return box.once && !once;
                });
                var add_addOnce = _listeners.find(function (box) {
                    return once && !box.once;
                });
                if (addOnce_add) {
                    throw new Error("You cannot addOnce() then try to add() the same listener " + "without removing the relationship first.");
                }
                if (add_addOnce) {
                    throw new Error("You cannot add() then addOnce() the same listener " + "without removing the relationship first.");
                }
            }
        };
        return Signal;
    }();

    function _arity(n, fn) {
        switch (n) {
            case 0:
                return function () {
                    return fn.apply(this, arguments);
                };
            case 1:
                return function (a0) {
                    return fn.apply(this, arguments);
                };
            case 2:
                return function (a0, a1) {
                    return fn.apply(this, arguments);
                };
            case 3:
                return function (a0, a1, a2) {
                    return fn.apply(this, arguments);
                };
            case 4:
                return function (a0, a1, a2, a3) {
                    return fn.apply(this, arguments);
                };
            case 5:
                return function (a0, a1, a2, a3, a4) {
                    return fn.apply(this, arguments);
                };
            case 6:
                return function (a0, a1, a2, a3, a4, a5) {
                    return fn.apply(this, arguments);
                };
            case 7:
                return function (a0, a1, a2, a3, a4, a5, a6) {
                    return fn.apply(this, arguments);
                };
            case 8:
                return function (a0, a1, a2, a3, a4, a5, a6, a7) {
                    return fn.apply(this, arguments);
                };
            case 9:
                return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
                    return fn.apply(this, arguments);
                };
            case 10:
                return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
                    return fn.apply(this, arguments);
                };
            default:
                throw new Error("First argument to _arity must be a non-negative integer no greater than ten");
        }
    }

    var _noop = function _noop(_) {
        return _;
    };

    function _curryN(length, received, fn) {
        return function () {
            var combined = [];
            var argsIdx = 0;
            var left = length;
            var combinedIdx = 0;
            while (combinedIdx < received.length || argsIdx < arguments.length) {
                var result = void 0;
                if (combinedIdx < received.length) {
                    result = received[combinedIdx];
                } else {
                    result = arguments[argsIdx];
                    argsIdx += 1;
                }
                combined[combinedIdx] = result;
                left -= 1;
                combinedIdx += 1;
            }
            return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
        };
    }

    function _curry1(fn) {
        return function f1() {
            if (arguments.length === 0) {
                return f1;
            } else {
                return fn.apply(this, arguments);
            }
        };
    }

    function curry(fn) {
        var length = fn.length;
        if (length === 1) {
            return _curry1(fn);
        }
        return _arity(length, _curryN(length, [], fn));
    }

    curry(function (xf, acc, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
            acc = xf(acc, list[idx]);
            idx += 1;
        }
        return acc;
    });

    curry(function (fn, list) {
        var idx = 0;
        var len = list.length;
        var result = [];
        while (idx < len) {
            if (fn(list[idx])) {
                result[result.length] = list[idx];
            }
            idx += 1;
        }
        return result;
    });

    curry(function (fn, list) {
        var idx = 0;
        var len = list.length;
        while (idx < len) {
            if (fn(list[idx])) {
                return list[idx];
            }
            idx += 1;
        }
    });

    var _isArray = function _isArray(val) {
        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === "[object Array]";
    };

    function _isString(x) {
        return Object.prototype.toString.call(x) === "[object String]";
    }
    function _isArrayLike(x) {
        var isArray = Array.isArray || _isArray;
        if (!x) {
            return false;
        }
        if (isArray(x)) {
            return true;
        }
        if ("object" !== (typeof x === "undefined" ? "undefined" : _typeof(x))) {
            return false;
        }
        if (_isString(x)) {
            return false;
        }
        if (x.nodeType === 1) {
            return !!x.length;
        }
        if (x.length === 0) {
            return true;
        }
        if (x.length > 0) {
            return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
        }
        return false;
    }

    function flatten(list) {
        var value, jlen, j;
        var result = [];
        var idx = 0;
        var ilen = list.length;
        while (idx < ilen) {
            if (_isArrayLike(list[idx])) {
                value = flatten(list[idx]);
                j = 0;
                jlen = value.length;
                while (j < jlen) {
                    result[result.length] = value[j];
                    j += 1;
                }
            } else {
                result[result.length] = list[idx];
            }
            idx += 1;
        }
        return result;
    }

    curry(function (fn, list) {
        var len = list.length;
        var idx = 0;
        while (idx < len) {
            fn(list[idx]);
            idx += 1;
        }
        return list;
    });

    var map = curry(function (fn, list) {
        var idx = 0;
        var length = list.length;
        var result = [];
        for (idx; idx < length; idx++) {
            result[idx] = fn(list[idx]);
        }
        return result;
    });

    curry(function (p, list) {
        return map(function (obj) {
            return obj[p];
        }, list);
    });

    function unique(arrArg) {
        return arrArg.filter(function (elem, pos, arr) {
            return arr.indexOf(elem) == pos;
        });
    }

    var DomWatcher = function () {
        function DomWatcher(root, getAllElements) {
            this.onAdded = new Signal();
            this.onRemoved = new Signal();
            this.root = root;
            this.getAllElements = getAllElements;
            this.init();
        }
        DomWatcher.prototype.init = function () {
            this.observer = new MutationObserver(this.handleMutations.bind(this));
            this.observer.observe(this.root, {
                attributes: false,
                childList: true,
                characterData: false,
                subtree: true
            });
        };
        DomWatcher.prototype.handleMutations = function (mutations) {
            var _this = this;
            mutations.forEach(function (mutation) {
                _this.getRemoved(mutation.removedNodes);
                _this.getAdded(mutation.addedNodes);
            });
        };
        DomWatcher.prototype.getAdded = function (addedNodes) {
            var nodes = flatten(addedNodes);
            nodes = nodes.filter(function (node) {
                return node.querySelectorAll;
            }).map(this.getAllElements).filter(function (nodes) {
                return nodes.length > 0;
            });
            nodes = flatten(nodes);
            nodes = unique(nodes);
            if (nodes.length > 0) {
                this.onAdded.emit(nodes);
            }
        };
        DomWatcher.prototype.getRemoved = function (removedNodes) {
            var nodes = flatten(removedNodes);
            nodes = nodes.filter(function (node) {
                return node.querySelectorAll;
            }).map(this.getAllElements).filter(function (nodes) {
                return nodes.length > 0;
            });
            nodes = flatten(nodes);
            nodes = unique(nodes);
            if (nodes.length > 0) {
                return this.onRemoved.emit(nodes);
            } else {
                return [];
            }
        };
        DomWatcher.prototype.dispose = function () {
            this.observer.disconnect();
            this.onAdded.disconnectAll();
            this.onRemoved.disconnectAll();
            this.observer = null;
            this.onAdded = null;
            this.onRemoved = null;
        };
        return DomWatcher;
    }();

    var REG_EXP = /[xy]/g;
    var STRING = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    var nextUid = function nextUid() {
        return STRING.replace(REG_EXP, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    var Handler = function () {
        function Handler(params) {
            var _a = params.definitions,
                definitions = _a === void 0 ? {} : _a,
                _b = params.dispatcher,
                dispatcher = _b === void 0 ? new EventTarget$1() : _b;
            this.definitions = definitions;
            this.dispatcher = dispatcher;
        }
        Handler.prototype.getDefinition = function (node) {};
        Handler.prototype.inCache = function (node) {
            return false;
        };
        Handler.prototype.updateCache = function (disposable) {};
        Handler.prototype.hasMediator = function (node) {
            return false;
        };
        Handler.prototype.create = function (node, Mediator) {
            throw new Error("not implemented");
        };
        Handler.prototype.getAllElements = function (node) {};
        Handler.prototype.destroy = function (node) {};
        Handler.prototype.dispose = function () {};
        return Handler;
    }();

    var Disposable = function () {
        function Disposable(_a) {
            var mediatorId = _a.mediatorId,
                node = _a.node,
                _b = _a.dispose,
                dispose = _b === void 0 ? _noop : _b;
            this.mediatorId = mediatorId;
            this.node = node;
            this.dispose = dispose;
        }
        return Disposable;
    }();

    var MediatorHandler = function (_super) {
        __extends(MediatorHandler, _super);
        function MediatorHandler(params) {
            if (params === void 0) {
                params = {};
            }
            var _this = _super.call(this, params) || this;
            _this.MEDIATORS_CACHE = [];
            return _this;
        }
        Object.defineProperty(MediatorHandler.prototype, "selector", {
            get: function get() {
                return "data-mediator";
            },
            enumerable: true,
            configurable: true
        });
        MediatorHandler.prototype.getDefinition = function (node) {
            return this.definitions[node.getAttribute(this.selector)];
        };
        MediatorHandler.prototype.inCache = function (node) {
            return !!this.MEDIATORS_CACHE.find(function (disposable) {
                return disposable.node === node;
            });
        };
        MediatorHandler.prototype.updateCache = function (disposable) {
            this.MEDIATORS_CACHE.push(disposable);
            return this.MEDIATORS_CACHE;
        };
        MediatorHandler.prototype.hasMediator = function (node) {
            return !!this.getDefinition(node) && !this.inCache(node);
        };
        MediatorHandler.prototype.create = function (node, Mediator) {
            var mediatorId = nextUid();
            node.setAttribute("mediatorid", mediatorId);
            var dispose = _noop;
            new Disposable({
                mediatorId: mediatorId,
                node: node,
                dispose: _noop
            });
            if (node.parentNode) {
                dispose = Mediator(node, this.dispatcher);
            }
            var disposable = new Disposable({
                mediatorId: mediatorId,
                node: node,
                dispose: dispose
            });
            this.updateCache(disposable);
            return disposable;
        };
        MediatorHandler.prototype.getAllElements = function (node) {
            var nodes = Array.from(node.querySelectorAll("[" + this.selector + "]")).slice(0);
            if (node.getAttribute(this.selector)) {
                nodes.unshift(node);
            }
            return nodes;
        };
        MediatorHandler.disposeMediator = function (disposable) {
            if (disposable) {
                disposable.dispose();
                disposable.node = null;
            }
        };
        MediatorHandler.prototype._destroy = function (node) {
            var l = this.MEDIATORS_CACHE.length;
            for (var i = 0; i < l; i++) {
                var disposable = this.MEDIATORS_CACHE[i];
                if (disposable) {
                    if (!disposable.node || disposable.node === node) {
                        disposable.dispose && disposable.dispose();
                        disposable.node = null;
                        this.MEDIATORS_CACHE[i] = null;
                    }
                } else {
                    this.MEDIATORS_CACHE[i] = null;
                }
            }
            return this.MEDIATORS_CACHE.filter(function (i) {
                return i;
            });
        };
        MediatorHandler.prototype.destroy = function (node) {
            this.MEDIATORS_CACHE = this._destroy(node);
            return this.MEDIATORS_CACHE;
        };
        MediatorHandler.prototype.dispose = function () {
            this.MEDIATORS_CACHE.forEach(MediatorHandler.disposeMediator);
            this.MEDIATORS_CACHE = null;
            this.dispatcher = null;
        };
        return MediatorHandler;
    }(Handler);

    var Bootstrap = function () {
        function Bootstrap(options) {
            var definitions = options.definitions,
                _a = options.loader,
                loader = _a === void 0 ? new AMDLoader() : _a,
                _b = options.root,
                root = _b === void 0 ? document.body : _b;
            this.definitions = definitions;
            this.loader = loader;
            this.root = root;
            this.handler = options.handler || new MediatorHandler({ definitions: definitions });
            this.domWatcher = options.domWatcher || new DomWatcher(root, this.handler.getAllElements.bind(this.handler));
            this.domWatcher.onAdded.connect(this.getMediators.bind(this));
            this.domWatcher.onRemoved.connect(this.handleRemoved.bind(this));
            this.init();
        }
        Bootstrap.prototype.init = function () {
            var nodes = [this.root].map(this.handler.getAllElements.bind(this.handler));
            this.promise = this.getMediators(nodes);
        };
        Bootstrap.prototype.getMediators = function (nodes) {
            var _this = this;
            nodes = flatten(nodes);
            var promises = nodes.filter(this.handler.hasMediator.bind(this.handler)).map(function (node) {
                var definition = _this.handler.getDefinition(node);
                return _this.loader.load(definition).then(function (Mediator) {
                    return _this.handler.create(node, Mediator);
                });
            });
            return Promise.all(promises);
        };
        Bootstrap.prototype.handleRemoved = function (nodes) {
            nodes.forEach(this.handler.destroy.bind(this.handler));
        };
        Bootstrap.prototype.dispose = function () {
            this.domWatcher.dispose();
            this.handler.dispose();
            this.domWatcher = null;
            this.handler = null;
            this.definitions = null;
            this.loader = null;
            this.root = null;
            this.promise = null;
        };
        return Bootstrap;
    }();

    var KE = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1 ", "h2", "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "main", "map", "mark", "menu", "menuitem", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"];
    var query = KE.map(function (e) {
        return ":not(" + e + ")";
    }).reduce(function (prev, curr) {
        return prev + curr;
    }, "*");
    var CustomElementHandler = function (_super) {
        __extends(CustomElementHandler, _super);
        function CustomElementHandler(params) {
            var _this = _super.call(this, params) || this;
            _this.REGISTERED_ELEMENTS = {};
            return _this;
        }
        CustomElementHandler.prototype.updateCache = function (id) {
            this.REGISTERED_ELEMENTS[id] = true;
            return this.REGISTERED_ELEMENTS;
        };
        CustomElementHandler.prototype.inCache = function (id) {
            return !!this.REGISTERED_ELEMENTS[id];
        };
        CustomElementHandler.prototype.getDefinition = function (node) {
            return this.definitions[node.tagName.toLowerCase()];
        };
        CustomElementHandler.prototype.create = function (node, Mediator) {
            var tagName = "";
            var dispatcher = this.dispatcher;
            if (!this.inCache(node.tagName.toLowerCase())) {
                tagName = node.tagName.toLowerCase();
                if (!tagName.match(/-/gim)) {
                    throw new Error("The name of a custom element must contain a dash (-). So <x-tags>, <my-element>, and <my-awesome-app> are all valid names, while <tabs> and <foo_bar> are not.");
                }
                window.customElements.define(tagName, function (_super) {
                    __extends(class_1, _super);
                    function class_1() {
                        return _super.call(this, dispatcher) || this;
                    }
                    return class_1;
                }(Mediator));
                this.updateCache(tagName);
            }
            return tagName;
        };
        CustomElementHandler.prototype.hasMediator = function (node) {
            var id = node.tagName.toLowerCase();
            return !!this.getDefinition(node) && !this.inCache(id);
        };
        CustomElementHandler.prototype.getAllElements = function (node) {
            return [node].concat([].slice.call(node.querySelectorAll(query), 0));
        };
        CustomElementHandler.prototype.dispose = function () {};
        CustomElementHandler.prototype.destroy = function () {};
        return CustomElementHandler;
    }(Handler);

    var bootstrap = function bootstrap(options) {
        return new Bootstrap(options);
    };

    exports.bootstrap = bootstrap;
    exports.Loader = Loader;
    exports.AMDLoader = AMDLoader;
    exports.CustomLoader = CustomLoader;
    exports.EventTarget = EventTarget$1;
    exports.Signal = Signal;
    exports.DomWatcher = DomWatcher;
    exports.MediatorHandler = MediatorHandler;
    exports.Bootstrap = Bootstrap;
    exports.CustomElementHandler = CustomElementHandler;
});
