export default function EventMap() {
    var currentListeners = [];
    return {

        mapListener: function (dispatcher, eventString, listener, scope) {

            var config;
            var i = currentListeners.length;
            while (i--) {
                config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {
                    return;
                }
            }
            var callback = listener;

            config = {
                dispatcher,
                eventString,
                listener,
                callback,
                scope,
                equalTo: (dispatcher, eventString, listener)=> (this.eventString == eventString && this.dispatcher == dispatcher && this.listener == listener)
            };

            currentListeners.push(config);
            dispatcher.addEventListener(eventString, callback, scope);

        },
        unmapListener: function (dispatcher, eventString, listener) {

            var i = currentListeners.length;
            while (i--) {
                var config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {

                    dispatcher.removeEventListener(eventString, config.callback, config.scope);

                    currentListeners.splice(i, 1);
                    return;
                }
            }
        },
        unmapListeners: function () {

            var eventConfig;
            var dispatcher;
            while (eventConfig = currentListeners.pop()) {

                dispatcher = eventConfig.dispatcher;
                dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);

            }
        }
    }

}


