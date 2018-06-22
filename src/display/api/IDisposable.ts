import _noop from "../../internal/_noop";

export default interface IDisposable {
    mediatorId: string,
    node: HTMLElement,
    dispose: () => void
}

export class Disposable implements IDisposable {
    constructor({mediatorId, node, dispose = _noop}) {
        this.mediatorId = mediatorId;
        this.node = node;
        this.dispose = dispose;
    }
}