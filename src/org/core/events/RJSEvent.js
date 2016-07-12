"use strict";

export default class RJSEvent {
    constructor(type, bubbles=false, cancelable=false) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.timeStamp = (new Date()).getTime();
        //
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.removed = false;
        this.target;
        this.currentTarget;
        this.eventPhase = 0;
    }

    preventDefault() {
        this.defaultPrevented = true;
    }

    stopPropagation() {
        this.propagationStopped = true;
    }

    stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    }

    remove() {
        this.removed = true;
    }

    clone() {
        return new RJSEvent(this.type, this.bubbles, this.cancelable);
    }
}