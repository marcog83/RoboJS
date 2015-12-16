/**
 * Created by marco.gobbi on 21/01/2015.
 */

import EventDispatcher from "../events/EventDispatcher";


export default  function(){
    var nextUid = ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    var MEDIATORS_CACHE = {};
   return Object.freeze({
        create: node=>Mediator=> {
            var mediatorId = nextUid();

            node.setAttribute('mediatorid', mediatorId);

            var _mediator = Mediator(EventDispatcher);

            MEDIATORS_CACHE[mediatorId] = _mediator;
            _mediator.initialize(node);
            return _mediator;

        },
        destroy: node=> {

            let mediatorId = node.getAttribute("mediatorId");
            let mediator = MEDIATORS_CACHE[mediatorId];
            if (mediator) {
                mediator.destroy && mediator.destroy(node);

                mediator.element && (mediator.element = null);
                MEDIATORS_CACHE[mediatorId] = null;
                delete MEDIATORS_CACHE[mediatorId];
                mediator = null;
                return true;
            }
            return false;

        }
    })
};