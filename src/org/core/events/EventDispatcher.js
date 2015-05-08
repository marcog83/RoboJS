let _currentListeners = {};

function addEventListener(type, callback, scope) {
    let listener = {
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
    let listeners = _currentListeners[eventName] || [];
    _currentListeners[eventName] = listeners.filter(function (listener) {
        var sameCB = listener.callback == callback;
        var sameScope = listener.scope == scope;
        return !(sameCB && sameScope);
    });
}

let removeAllEventListeners = (eventName)=> _currentListeners[eventName] = null;
let hasEventListener = (eventName) => _currentListeners[eventName] && _currentListeners[eventName].length;

function dispatchEvent(type, data) {
    let listeners = _currentListeners[type] || [];
    let length = listeners.length, l, c, s;
    for (let i = 0; i < length; i++) {
        l = listeners[i];
        c = l.callback;
        s = l.scope;
        c.call(s, data);
    }
}
export default {
    addEventListener,
    removeEventListener,
    removeAllEventListeners,
    hasEventListener: hasEventListener,
    dispatchEvent
};