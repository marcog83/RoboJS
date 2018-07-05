import _noop from "../internal/_noop";

export class Disposable  {

    constructor({mediatorId = "", node = null, dispose = _noop}={}) {
        this.mediatorId = mediatorId;
        this.node = node;
        this.dispose = dispose;
    }
}