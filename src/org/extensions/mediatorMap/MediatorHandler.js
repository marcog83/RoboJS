/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(["robojs", "Promise"], function (RoboJS, Promise) {
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
                    return this.loader.get(dep).then(function (Dep) {
                        return this.injector.map(Dep, dep);
                    }.bind(this))
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
    return MediatorHandler;
});