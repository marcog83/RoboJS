/**
 * Created by marco.gobbi on 21/01/2015.
 */
import RoboJS from "../robojs";
import EventDispatcher from "../events/EventDispatcher";
import EventMap from "../events/EventMap";
import R from "ramda";

export default  {
    create: R.curryN(3, function (node, def, Mediator) {
        var mediatorId = RoboJS.utils.nextUid();
        //node.dataset = node.dataset || {};
        node.setAttribute('mediatorId', mediatorId);
        //node.dataset.mediatorId = mediatorId;
        //
        var _mediator = Mediator(EventDispatcher, EventMap());
        _mediator.id = mediatorId;
        RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
        _mediator.initialize(node);
        return _mediator;
    }),
    destroy: function (node) {

        let mediatorId = node.getAttribute("mediatorId"); //&& node.dataset.mediatorId;
        let mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
        if (mediator) {
            mediator.destroy && mediator.destroy(node);
            mediator.postDestroy && mediator.postDestroy();
            mediator.element && (mediator.element = null);
            RoboJS.MEDIATORS_CACHE[mediatorId] = null;
            delete RoboJS.MEDIATORS_CACHE[mediatorId];
            mediator = null;
            return true;
        }
        return false;

    }
};