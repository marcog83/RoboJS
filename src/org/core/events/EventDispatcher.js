
var dispatcher=()=>{
    let _currentListeners = {};
    return Object.freeze({

        addEventListener: (eventName, callback, scope)=> {
            var listener = {
                eventName,
                callback,
                scope
            };
            _currentListeners[eventName] = _currentListeners[eventName] ? _currentListeners[eventName].concat([listener]) : [].concat([listener]);
            return listener;
        },
        removeEventListener: (eventName, _callback, _scope) => {
            _currentListeners[eventName] && (_currentListeners[eventName] = _currentListeners[eventName].filter(({callback,scope})=> !((callback === _callback) && (scope === _scope))));
        },
        removeAllEventListeners: eventName=> {
            _currentListeners[eventName] = null;
            delete _currentListeners[eventName];
        },
        hasEventListener: eventName => _currentListeners[eventName] && _currentListeners[eventName].length,
        dispatchEvent: (eventName, data) => {
            _currentListeners[eventName] && _currentListeners[eventName].forEach(({callback,scope})=> {
                callback.call(scope, data)
            });
        }
    })
};
export default dispatcher();
export var makeDispatcher=()=> Object.assign({},dispatcher());