define(["robojs"], function (RoboJS) {
    var EventDispatcherExtension = {
        extend: function (context) {
            // map EventDispatcher
            context.injector.map(RoboJS.events.EventDispatcher, 'EventDispatcher').asSingleton();

        }
    };
    return EventDispatcherExtension;
});