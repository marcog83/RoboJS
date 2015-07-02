export default !function () {
    var _currentListeners = {};

    function addEventListener(type, callback, scope) {
        var listener = {
            type: type,
            callback: callback,
            scope: scope
        };
        if (!_currentListeners[type]) {
            _currentListeners[type] = [];
        }
        _currentListeners[type].push(listener);
        return listener;
    }

    function removeEventListener(eventName, callback, scope) {
        var listeners = _currentListeners[eventName] || [];
        _currentListeners[eventName] = listeners.filter(function (listener) {
            var sameCB = listener.callback == callback;
            var sameScope = listener.scope == scope;
            return !(sameCB && sameScope);
        });
    }



    function dispatchEvent(type, data) {
        var listeners = _currentListeners[type] || [];
        var length = listeners.length, l, c, s;
        for (var i = 0; i < length; i++) {
            l = listeners[i];
            c = l.callback;
            s = l.scope;
            c.call(s, data);
        }
    };
    return {
        addEventListener,
        removeEventListener,
        removeAllEventListeners:eventName=> _currentListeners[eventName] = null,
        hasEventListener: eventName => _currentListeners[eventName] && _currentListeners[eventName].length,
        dispatchEvent
    };
}()