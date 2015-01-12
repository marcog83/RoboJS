define(["./EventMapConfig"], function (EventMapConfig) {

    /**
     * <h2><strong>EventMap</strong></h2>
     * <p>The Event Map keeps track of listeners and provides the ability
     * to unregister all listeners with a single method call.</p>
     */
    function EventMap() {
        this._listeners = [];

    }

    EventMap.prototype = {
        /**
          <h3>mapListener</h3>
        * <p>The same as calling addEventListener directly on the EventDispatcher, but keeps a list of listeners for easy (usually automatic) removal.</p>
        * @param dispatcher <code>EventDispatcher</code> -- The EventDispatcher to listen to
         *@param eventString <code>String</code> -- The Event type to listen for
         *@param listener <code>Function</code> -- The Event handler
         *@param scope <code>*</code> -- the listener scope (default = null)
        */
        mapListener: function (dispatcher, eventString, listener, scope) {
            var currentListeners = this._listeners;

            var config;
            var i = currentListeners.length;
            while (i--) {
                config = currentListeners[i];
                if (config.equalTo(dispatcher, eventString, listener)) {
                    return;
                }
            }
            var callback = listener;

            config = new EventMapConfig(dispatcher, eventString, listener, callback, scope);

            currentListeners.push(config);
            dispatcher.addEventListener(eventString, callback, scope);

        },
        /**
         * <h3>unmapListener</h3>
         * <p>The same as calling <code>removeEventListener</code> directly on the <code>EventDispatcher</code>,
         * but updates our local list of listeners.</p>
         *
         * @param dispatcher The <code>EventDispatcher</code>
         * @param eventString The <code>String</code> type
         * @param listener The <code>Function</code> handler

         */
        unmapListener: function (dispatcher, eventString, listener) {
            var currentListeners = this._listeners;

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
        /**
         * <h3>unmapListeners</h3>
         * <p>Removes all listeners registered through <code>mapListener</code></p>
         */
        unmapListeners: function () {
            var currentListeners = this._listeners;

            var eventConfig;
            var dispatcher;
            while (eventConfig = currentListeners.pop()) {

                dispatcher = eventConfig.dispatcher;
                dispatcher.removeEventListener(eventConfig.eventString, eventConfig.callback, eventConfig.scope);

            }
        }
    };
    return EventMap;
});