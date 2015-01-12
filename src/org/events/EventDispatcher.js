define([], function () {
    /*
     * <h2><strong>EventDispatcher</strong></h2>
     * <p>The EventDispatcher class is a Singleton that handle Events in RoboJS.<br/>
     * It can also be used as the base class for all classes that dispatch events.</p>
     * */
    function EventDispatcher() {
        this._currentListeners = {};
    }

    EventDispatcher.prototype = {
        /**
         * <h3>addEventListener</h3>
         * <p>Registers an event listener object with an EventDispatcher object so that the listener receives notification of an event.</p>
         * @param type <code>String</code> the event name to listen
         * @param callback <code>Function</code> the callback to execute
         * @param scope <code>Object</code> the scope of the callback (default=null)
         * @returns <code>Object</code> the listener added
         */
        addEventListener: function (type, callback, scope) {
            var listener = {
                type: type,
                callback: callback,
                scope: scope
            };
            if (!this._currentListeners[type]) {
                this._currentListeners[type] = [];
            }
            this._currentListeners[type].push(listener);
            return listener;
        },
        /**
         *<h3>removeEventListener</h3>
         * <p>Removes a listener from the EventDispatcher object.</p>
         * @param eventName <code>String</code> the event name to remove
         * @param callback <code>Function</code> the callback to unmap
         * @param scope <code>Object</code> the scope of the callback
         */
        removeEventListener: function (eventName, callback, scope) {
            var listeners = this._currentListeners[eventName] || [];
            this._currentListeners[eventName] = listeners.filter(function (listener) {
                var sameCB = listener.callback == callback;
                var sameScope = listener.scope == scope;
                return !(sameCB && sameScope);
            });
        },
        /**
         *<h3>removeAllEventListeners</h3>
         * <p>Removes all listeners from the EventDispatcher object.</p>
         * @param eventName <code>String</code> the event name to remove
         */
        removeAllEventListeners: function (eventName) {
            this._currentListeners[eventName] = null;
        },
        /**
         *<h3>hasEventListener</h3>
         * <p>Checks whether the EventDispatcher object has any listeners registered for a specific type of event.</p>
         * @param eventName <code>String</code> the event to check
         * @returns <code>*</code>
         */
        hasEventListener: function (eventName) {
            return this._currentListeners[eventName] && this._currentListeners[eventName].length
        },
        /**
         *<h3>dispatchEvent</h3>
         * <p>Dispatches an event into the event flow.</p>
         * @param type <code>String</code> the event to dispatch
         * @param data <code>*</code> the data to pass
         */
        dispatchEvent: function (type, data) {
            var listeners = this._currentListeners[type] || [];
            var length = listeners.length, l, c, s;
            for (var i = 0; i < length; i++) {
                l = listeners[i];
                c = l.callback;
                s = l.scope;
                c.call(s, data);
            }
        }
    };
    EventDispatcher.__instance = null;
    /**
     * <h3>getInstance</h3>
     * <p>static method to get Singleton instance</p>
     * @returns <code>EventDispatcher</code>
     */
    EventDispatcher.getInstance = function () {

        if (!EventDispatcher.__instance) {
            EventDispatcher.__instance = new EventDispatcher();
        }
        return EventDispatcher.__instance;
    };
    return EventDispatcher;
});