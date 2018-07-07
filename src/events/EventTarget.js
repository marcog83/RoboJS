import root from "../internal/_root";
export class EventDispatcher {

    constructor() {
        this.listeners_ = {};

    }


    addEventListener(type, handler) {

        // let listeners_type = this.listeners_[type];
        if (!this.listeners_[type]) {
            this.listeners_[type] = [];
        }
        if (!this.listeners_[type].includes(handler)) {
            this.listeners_[type].push(handler);
        }


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
            .map(handler => handler.handleEvent ? handler.handleEvent.bind(handler) : handler)
            .forEach(handler => {
                prevented = handler(event) === false;

            });

        return !prevented && !event.defaultPrevented;
    }
}

//


let _EventTarget = root.EventTarget;

try {
    new _EventTarget();
} catch (e) {
    _EventTarget = EventDispatcher;
}
export const EventTarget = _EventTarget;
