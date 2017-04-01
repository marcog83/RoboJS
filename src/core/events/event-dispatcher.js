import RJSEvent from "./rjs-event";
class EventDispatcher {
    constructor() {
        this._listeners = {};
    }

    addEventListener(type, listener, useCapture) {
        var listeners;
        if (useCapture) {
            listeners = this._captureListeners = this._captureListeners || {};
        } else {
            listeners = this._listeners = this._listeners || {};
        }
        var arr = listeners[type];
        if (arr) {
            this.removeEventListener(type, listener, useCapture);
        }
        arr = listeners[type]; // remove may have deleted the array
        if (!arr) {
            listeners[type] = [listener];
        }
        else {
            arr.push(listener);
        }
        return listener;
    }

    removeEventListener(type, listener, useCapture) {
        var listeners = useCapture ? this._captureListeners : this._listeners;
        if (!listeners) {
            return;
        }
        var arr = listeners[type];
        if (!arr) {
            return;
        }
        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i] == listener) {
                if (l == 1) {
                    delete(listeners[type]);
                } // allows for faster checks.
                else {
                    arr.splice(i, 1);
                }
                break;
            }
        }
    }

    removeAllEventListeners(type) {
        if (!type) {
            this._listeners = this._captureListeners = null;
        }
        else {
            if (this._listeners) {
                delete(this._listeners[type]);
            }
            if (this._captureListeners) {
                delete(this._captureListeners[type]);
            }
        }
    }

    dispatchEvent(eventObj) {
        if (typeof eventObj == "string") {
            // won't bubble, so skip everything if there's no listeners:
            var listeners = this._listeners;
            if (!listeners || !listeners[eventObj]) {
                return false;
            }
            eventObj = new RJSEvent(eventObj);
        } else if (eventObj.target && eventObj.clone) {
            // redispatching an active event object, so clone it:
            eventObj = eventObj.clone();
        }
        try {
            eventObj.target = this;
        } catch (e) {
        } // try/catch allows redispatching of native events

        if (!eventObj.bubbles || !this.parent) {
            this._dispatchEvent(eventObj, 2);
        } else {
            var top = this, list = [top];
            while (top.parent) {
                list.push(top = top.parent);
            }
            var i, l = list.length;

            // capture & atTarget
            for (i = l - 1; i >= 0 && !eventObj.propagationStopped; i--) {
                list[i]._dispatchEvent(eventObj, 1 + (i == 0));
            }
            // bubbling
            for (i = 1; i < l && !eventObj.propagationStopped; i++) {
                list[i]._dispatchEvent(eventObj, 3);
            }
        }
        return eventObj.defaultPrevented;
    }

    hasEventListener(type) {
        var listeners = this._listeners, captureListeners = this._captureListeners;
        return !!((listeners && listeners[type]) || (captureListeners && captureListeners[type]));
    }

    _dispatchEvent(eventObj, eventPhase) {
        var l, listeners = (eventPhase == 1) ? this._captureListeners : this._listeners;
        if (eventObj && listeners) {
            var arr = listeners[eventObj.type];
            if (!arr || !(l = arr.length)) {
                return;
            }
            try {
                eventObj.currentTarget = this;
            } catch (e) {
            }
            try {
                eventObj.eventPhase = eventPhase;
            } catch (e) {
            }
            eventObj.removed = false;
            arr = arr.slice(); // to avoid issues with items being removed or added during the dispatch
            for (var i = 0; i < l && !eventObj.immediatePropagationStopped; i++) {
                var o = arr[i];
                if (o.handleEvent) {
                    o.handleEvent(eventObj);
                }
                else {
                    o(eventObj);
                }
                if (eventObj.removed) {
                    this.removeEventListener(eventObj.type, o, eventPhase == 1);
                    eventObj.removed = false;
                }
            }
        }
    }

}
export default new EventDispatcher();
export var makeDispatcher = ()=>new EventDispatcher();