
export default function EventMap() {
    let currentListeners = [];
    return {

        mapListener: function (dispatcher, eventString, listener, scope) {

            let config;
            let i = currentListeners.length;
            while (i--) {
                config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {
                    return;
                }
            }
            let callback = listener;

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

        }
        ,

        unmapListener: function (dispatcher, eventString, listener) {

            let i = currentListeners.length;
            while (i--) {
                let config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {

                    dispatcher.removeEventListener(eventString, config.callback, config.scope);

                    currentListeners.splice(i, 1);
                    return;
                }
            }
        }
        ,

        unmapListeners: function () {

            let eventConfig;
            let dispatcher;
            while (eventConfig = currentListeners.pop()) {

                dispatcher = eventConfig.dispatcher;
                dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);

            }
        }
    }

}


