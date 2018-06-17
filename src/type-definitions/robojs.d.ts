interface BootstrapConfig {
    handler?: Handler;
    definitions: any;
    loader?: Loader;
    root?: HTMLElement;
    domWatcher?: DomWatcher;
}

interface Bootstrap {
    handler: Handler;
    definitions: any;
    loader: Loader;
    root: HTMLElement;
    domWatcher: DomWatcher;
    promise: Promise<any>;

    new(BootstrapConfig): Bootstrap;
}

interface DomWatcher {

}

interface Handler {

}

interface Loader {

}