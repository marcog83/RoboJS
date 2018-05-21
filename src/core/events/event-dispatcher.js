/**
 * Creates a new EventTarget. This class implements the DOM level 2
 * EventTarget interface and can be used wherever those are used.
 * @constructor
 * @implements {EventTarget}
 */

class EventTarget {
    constructor() {
        this.listeners_ = {};

    }

    /**
     * Adds an event listener to the target.
     * @param {string} type The name of the event.
     * @param {EventListenerType} handler The handler for the event. This is
     *     called when the event is dispatched.
     */
    addEventListener(type, handler) {


        if (!(type in this.listeners_)) {
            this.listeners_[type] = [handler];
        } else {
            const handlers = this.listeners_[type];
            if (handlers.indexOf(handler) < 0) {

                handlers.push(handler);

            }

        }
    }

    /**
     * Removes an event listener from the target.
     * @param {string} type The name of the event.
     * @param {EventListenerType} handler The handler for the event.
     */
    removeEventListener(type, handler) {


        if (type in this.listeners_) {
            const handlers = this.listeners_[type];
            const index = handlers.indexOf(handler);

            if (index >= 0) {

                // Clean up if this was the last listener.
                if (handlers.length === 1) {
                    delete this.listeners_[type];
                }

                else {
                    handlers.splice(index, 1);
                }

            }
        }
    }

    /**
     * Dispatches an event and calls all the listeners that are listening to
     * the type of the event.
     * @param {!Event} event The event to dispatch.
     * @return {boolean} Whether the default action was prevented. If someone
     *     calls preventDefault on the event object then this returns false.
     */
    dispatchEvent(event) {
        // Since we are using DOM Event objects we need to override some of the
        // properties and methods so that we can emulate this correctly.
        const self = this;
        event.__defineGetter__("target", function () {
            return self;
        });

        const type = event.type;
        let prevented = 0;
        if (type in this.listeners_) {
            // Clone to prevent removal during dispatch
            let handlers = this.listeners_[type].concat();

            for (let i = 0; i < handlers.length; i++) {
                let handler = handlers[i];
                if (handler.handleEvent) {
                    prevented |= handler.handleEvent.call(handler, event) === false;
                }

                else {
                    prevented |= handler.call(this, event) === false;
                }

            }
        }

        return !prevented && !event.defaultPrevented;
    }
}

var G = typeof global === typeof null ? global : self;

var _EventTarget = G.EventTarget;

try {
    new EventTarget();
} catch (e) {
    _EventTarget = EventTarget;
}
export default _EventTarget;
