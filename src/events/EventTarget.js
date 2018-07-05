export class EventDispatcher {

    constructor() {
        this.listeners_ = {};

    }


    addEventListener(type, handler) {

        let listeners_type = this.listeners_[type];
        if (listeners_type === undefined) {
            this.listeners_[type] = listeners_type = [];
        }

        for (let i = 0, l; l = listeners_type[i]; i++) {
            if (l === handler) return;
            listeners_type.push(handler);
        }


        // if (!(type in this.listeners_)) {
        //     this.listeners_[type] = [handler];
        // } else {
        //     const handlers = this.listeners_[type];
        //     if (handlers.indexOf(handler) < 0) {
        //
        //         handlers.push(handler);
        //
        //     }
        //
        // }
    }


    removeEventListener(type, handler) {

        let listeners_type = this.listeners_[type];
        if (listeners_type === undefined) return;
        for (let i = 0, l; l = listeners_type[i]; i++)
            if (l === handler) {
                listeners_type.splice(i, 1);
                break;
            }

        if (!listeners_type.length) {
            delete this.listeners_[type];
        }

        /*



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
        }*/
    }


    dispatchEvent(event) {
        // Since we are using DOM Event objects we need to override some of the
        // properties and methods so that we can emulate this correctly.
        const self = this;
        event.__defineGetter__("target", function () {
            return self;
        });

        const type = event.type;
        let prevented = 0;

        let listeners_type = this.listeners_[type];
        if (listeners_type === undefined) return true;

        let handlers = listeners_type.concat();

        handlers
            .map(handler => handler.handleEvent || handler)
            .forEach(handler => {
                prevented = handler(event) === false ? 0 : 1;

            });

        return !prevented && !event.defaultPrevented;
    }
}

//
var G = typeof global === typeof null ? global : self;

var _EventTarget = G.EventTarget;

try {
    new _EventTarget();
} catch (e) {
    _EventTarget = EventDispatcher;
}
export const EventTarget = _EventTarget;
