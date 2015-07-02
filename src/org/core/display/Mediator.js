export default function Mediator(eventDispatcher, eventMap) {


    return {

        postDestroy: ()=> eventMap.unmapListeners(),
        addContextListener: (eventString, listener, scope)=>  eventMap.mapListener(eventDispatcher, eventString, listener, scope),
        removeContextListener: (eventString, listener)=> eventMap.unmapListener(eventDispatcher, eventString, listener),
        dispatch: (eventString, data)=> {
            if (eventDispatcher.hasEventListener(eventString)) {
                eventDispatcher.dispatchEvent(eventString, data);
            }
        },
        initialize: node=> node

    }

}


