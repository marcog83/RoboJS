(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(["robojs",'jss'], factory);
	} else {
		  factory(root.RoboJS,root.jss);
	}
}(this, function (RoboJS,jss) {
	'use strict';

    'use strict';
    function Context() {
        this.setup();
    }

    Context.prototype = {
        setup: function () {
            this.injector = new jss.Injector();
            this.injector.map('Injector').toValue(this.injector);
            this.injector.map('Context').toValue(this);
            this.extensions = [];

            this._configCache = [];
            this.configs = [];
        },
        install: function () {
            var extensions = Array.prototype.slice.call(arguments, 0);
            extensions.forEach(this._extendAll.bind(this));
            this.extensions = this.extensions.concat(extensions);

            return this;
        },
        configure: function (type, name) {
            this.configs.push({
                type: type,
                name: name
            });
            return this;
            //
        },
        initialize: function () {
            // configure extensions and configs;

            this.configs.forEach(this._configureAll.bind(this));
            // initialize extensions and configs;
            this.extensions.forEach(this._initExtension.bind(this));
            this.configs.forEach(this._initConfig.bind(this));
        },
        _extendAll: function (extension) {
            extension.extend(this);
        },
        _configureAll: function (config) {
            var conf = this._configCache[config.name] = this._configCache[config.name] || this.injector.getOrCreateNewInstance(config.type, config.name);
            conf.configure();
            return conf;
        },
        _initConfig: function (conf) {
            conf.initialize && conf.initialize();
        },
        _initExtension: function (extension) {
            extension.initialize && extension.initialize();
        }
    };
    
/**
 * Created by marco.gobbi on 21/01/2015.
 */

	"use strict";
	RoboJS.framework={
		Context:Context
	}
;
/**
 * Created by marco.gobbi on 21/01/2015.
 */

    "use strict";
    function MediatorHandler(injector, loader) {
        this.injector = injector;
        this.loader = loader;
    }

    MediatorHandler.prototype = {
        create: function (node, Mediator, def) {


            var mediatorId = RoboJS.utils.nextUid();
            node.dataset = node.dataset || {};
            node.dataset.mediatorId = mediatorId;

            if (def.dependencies && def.dependencies.length) {
                var $inject = [];
                var promises = def.dependencies.map(function (dep) {
                    $inject.push(dep);
                    return this.loader.get(dep).then(RoboJS.utils.flip(this.injector.map).bind(this.injector,dep));


                    //return this.loader.get(dep).then(function (Dep) {
                    //    return this.injector.map(Dep, dep);
                    //}.bind(this))
                }.bind(this));
                return Promise.all(promises).then(function () {
                    var type = $inject.concat(["EventDispatcher", "EventMap", Mediator]);
                    return this._initMediator(type, mediatorId, Mediator, def, node);
                }.bind(this));
            } else {
                var type = ["EventDispatcher", "EventMap", Mediator];
                return Promise.resolve(this._initMediator(type, mediatorId, Mediator, def, node));
            }

        },

        _initMediator: function (type, mediatorId, Mediator, def, node) {
            var _mediator = this.injector.getOrCreateNewInstance(type, def.id);
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
                mediator.eventDispatcher && (mediator.eventDispatcher = null);
                mediator.eventMap && (mediator.eventMap = null);
                RoboJS.MEDIATORS_CACHE[mediatorId] = null;

                mediator = null;
            }
        }
    };
    

    'use strict';
    var MediatorMapExtension = {
        extend: function (context) {
            this.injector = context.injector;
            // map how to handle Mediator Creation
            this.injector.map([
                "Injector",
                "ScriptLoader",
                MediatorHandler
            ], "MediatorHandler").asSingleton();

            // map MediatorsBuilder
            this.injector.map([
                'DisplayList',
                'ScriptLoader',
                'MediatorHandler',
                'MediatorsMap',
                RoboJS.display.MediatorsBuilder
            ], 'MediatorsBuilder').asSingleton();

            this.injector.map(RoboJS.events.EventMap, 'EventMap');
        },
        initialize: function () {
            // when all dependencies are ready, bootstrap MediatorsBuilder
            var builder = this.injector.getInstance('MediatorsBuilder');
            builder.bootstrap();
        }
    };
    

    'use strict';
    var DomWatcherExtension = {
        extend: function (context) {
            this.injector = context.injector;
            // how to handle DOM changes
            this.injector.map(RoboJS.display.DisplayList, 'DisplayList');

        }
    };
    

    var EventDispatcherExtension = {
        extend: function (context) {
            // map EventDispatcher
            context.injector.map(RoboJS.events.EventDispatcher, 'EventDispatcher').asSingleton();

        }
    };
    

    'use strict';
    var LoaderExtension = {
        extend: function (context) {
            this.injector = context.injector;

            // how to load external scripts
            this.injector.map(RoboJS.net.ScriptLoader, 'ScriptLoader');


        }
    };
    


    var MVCBundle = {
        extend: function (context) {
            context.install(
                DomWatcherExtension,
                EventDispatcherExtension,
                LoaderExtension,
                MediatorMapExtension
            );
        }
    };
    
/**
 * Created by marco.gobbi on 21/01/2015.
 */

    "use strict";
    RoboJS.extensions = {
        MVCBundle: MVCBundle,
        MediatorMapExtension: MediatorMapExtension
    }
;

;





return RoboJS;
}));