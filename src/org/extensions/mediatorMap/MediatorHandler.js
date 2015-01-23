/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(["RoboJS"], function (RoboJS) {
    "use strict";
    function MediatorHandler(injector) {
        this.injector = injector;
    }

    MediatorHandler.prototype = {
        create: function (node, Mediator) {
            var mediatorId = RoboJS.utils.nextUid();
            node.dataset = node.dataset || {};
            node.dataset.mediatorId = mediatorId;
            Mediator.$inject = Mediator.$inject || [];
            Mediator.$inject.push("EventDispatcher");
            Mediator.$inject.push("EventMap");
            Mediator.$inject.push(Mediator);
            var _mediator = this.injector.getOrCreateNewInstance(Mediator, Mediator.$name);

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