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
        create: function (node, def, Mediator) {
            var mediatorId = RoboJS.utils.nextUid();
           // node.dataset = node.dataset || {};
           // node.dataset.mediatorId = mediatorId;
	        node.setAttribute('mediatorId',mediatorId);
            //
            def.dependencies = def.dependencies || [];
            //
            var params = {
                type: def.dependencies.concat(["EventDispatcher", "EventMap", Mediator]),
                mediatorId: mediatorId,
                Mediator: Mediator,
                def: def,
                node: node
            };
            var promises = def.dependencies.map(function (dep) {
                return this.loader.get(dep).then(RoboJS.utils.flip(this.injector.map).bind(this.injector, dep));
            }.bind(this));

            //
            return Promise.all(promises).then(this._initMediator.bind(this, params));

        },

        _initMediator: function (params) {
            var _mediator = this.injector.getOrCreateNewInstance(params.type, params.def.id);
            _mediator.id = params.mediatorId;
            RoboJS.MEDIATORS_CACHE[params.mediatorId] = _mediator;
            _mediator.initialize(params.node);
            return _mediator;
        },
        destroy: function (node) {
            var mediatorId =node.getAttribute('mediatorId');// node.dataset && node.dataset.mediatorId;
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