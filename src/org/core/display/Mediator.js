export default function Mediator(eventDispatcher, eventMap) {

    let element;
    let postDestroy = ()=> eventMap.unmapListeners();
    let addContextListener = (eventString, listener, scope)=>  eventMap.mapListener(eventDispatcher, eventString, listener, scope);
    let removeContextListener = (eventString, listener)=> eventMap.unmapListener(eventDispatcher, eventString, listener);
    let dispatch = (eventString, data)=> {
        if (eventDispatcher.hasEventListener(eventString)) {
            eventDispatcher.dispatchEvent(eventString, data);
        }
    };
    let initialize = (node)=> element = node;
    return {

        postDestroy,
        addContextListener,
        removeContextListener,
        dispatch,
        initialize

    }

}


