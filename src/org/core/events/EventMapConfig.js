define([], function () {
/*
 <h2>EventMapConfig</h2>
 */
    function EventMapConfig(dispatcher, eventString, listener, callback, scope) {
        this.dispatcher = dispatcher;
        this.eventString = eventString;
        this.listener = listener;
        this.callback = callback;
        this.scope = scope;
    }

    EventMapConfig.prototype = {
        equalTo: function (dispatcher, eventString, listener) {
            return this.eventString == eventString
                && this.dispatcher == dispatcher
                && this.listener == listener;

        }
    };
    return EventMapConfig;
});