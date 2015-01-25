/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(["../core","../events/EventDispatcher","../events/EventMap"],function (RoboJS,EventDispatcher,EventMap) {
	"use strict";


	function MediatorHandler() {
	}

	MediatorHandler.prototype = {
		create: function (node, Mediator,mediatorName) {
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
	return MediatorHandler;
});