function RJSEvent(type, data = null, bubbles = false, cancelable = false) {
    this.data = data;
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


RJSEvent.prototype = {


    preventDefault() {
        this.defaultPrevented = true;
    },

    stopPropagation() {
        this.propagationStopped = true;
    },

    stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    },

    remove() {
        this.removed = true;
    },

    clone() {
        return new RJSEvent(this.type, this.data, this.bubbles, this.cancelable);
    }
};
export default  RJSEvent ;