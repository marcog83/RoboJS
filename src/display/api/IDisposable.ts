import _noop from "../../internal/_noop";

export interface IDisposable {
    mediatorId: string,
    node: HTMLElement,
    dispose: (_?: any) => any
}

export class Disposable implements IDisposable {
    mediatorId: string;
    node: HTMLElement;
    dispose: (_?: any) => any;

    constructor({mediatorId = "", node = null, dispose = _noop}={}) {
        this.mediatorId = mediatorId;
        this.node = node;
        this.dispose = dispose;
    }
}