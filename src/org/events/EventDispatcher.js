define([], function () {
    /*
     * <strong>EventDispatcher</strong>
     * <p>The EventDispatcher class is a Singleton that handle Events in RoboJS.<br/>
     * It can also be used as the base class for all classes that dispatch events.</p>
     * */
    function EventDispatcher() {
        this._currentListeners = {};
    }

    EventDispatcher.prototype = {
        /**
         *<strong>addEventListener</strong>
         * @param type {String} the event name to listen
         * @param callback {Function} the callback to execute
         * @param scope {Object | null} the scope of the callback
         * @returns {Object} the listener added
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
         *<strong>removeEventListener</strong>
         * @param eventName {String} the event name to remove
         * @param callback {Function} the callback to unmap
         * @param scope {Object | null} the scope of the callback
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
         *<strong>removeAllEventListeners</strong>
         * @param eventName {String} the event name to remove
         */
        removeAllEventListeners: function (eventName) {
            this._currentListeners[eventName] = null;
        },
        /**
         *<strong>hasEventListener</strong>
         * @param eventName {String} the event to check
         * @returns {*}
         */
        hasEventListener: function (eventName) {
            return this._currentListeners[eventName] && this._currentListeners[eventName].length
        },
        /**
         *<strong>dispatchEvent</strong>
         * @param type {String} the event to dispatch
         * @param data {*} the data to pass
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
    EventDispatcher.getInstance = function () {

        if (!EventDispatcher.__instance) {
            EventDispatcher.__instance = new EventDispatcher();
        }
        return EventDispatcher.__instance;
    };
    return EventDispatcher;
});