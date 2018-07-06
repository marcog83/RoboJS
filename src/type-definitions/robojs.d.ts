interface Robo {


    promise: Promise<any>;

    dispose(): void;
}

interface RoboConfig {
    handler?: AHandler;
    definitions: any;
    loader?: Loader;
    root?: HTMLElement;
    watcher?: Watcher;
}


declare const Robo: {
    prototype: Robo;
    new(options: RoboConfig): Robo;
};


interface Disposable {
    mediatorId: string;
    node: HTMLElement;
    dispose: (_?: any) => void;
}

interface DisposableConfig {
    mediatorId?: string;
    node?: any;
    dispose?: (_: any) => void;
}

declare const Disposable: {
    prototype: Disposable;
    new(options?: DisposableConfig): Disposable;
};


interface Watcher {
    onAdded: Signal;
    onRemoved: Signal;
    dispose(): void;
}

declare const DomWatcher: {
    prototype: Watcher;
    new(root: any, handler: AHandler): Watcher;
};


interface AHandler {
    definitions: {};
    dispatcher: EventTarget;

    getAllElements(node: HTMLElement): Array<Element>;

    hasMediator(node: any): boolean;

    getDefinition(node: any): any;

    create(node: HTMLElement, Mediator: any): Disposable;

    destroy(node: HTMLElement): void;

    dispose(): void;
}

interface AHandlerConfig {
    definitions: {};
    dispatcher?: EventTarget
}

declare const AHandler: {
    prototype: AHandler;
    new(params: AHandlerConfig): AHandler;
};
declare const CustomElementHandler: {
    prototype: AHandler;
    new(params: AHandlerConfig): AHandler;
};
declare const MediatorHandler: {
    prototype: AHandler;
    new(params: AHandlerConfig): AHandler;
};


declare const nextUid: () => string;


interface Signal {
    connect(slot: Function, scope?: any): void;

    connectOnce(slot: Function, scope?: any): void;

    emit(...args: any[]): void;

    disconnect(slot: Function, scope?: any): void;

    disconnectAll(): void;
}

declare const Signal: {
    prototype: Signal;
    new(): Signal;
};


interface Loader {
    load(id: string): Promise<any>
}
declare const Loader: {
    prototype: Loader;
    new(): Loader;
    onComplete(id: any, resolve: any, reject: any): void;
};
declare const AMDLoader: {
    prototype: Loader;
    new(): Loader;
};
declare const CustomLoader: {
    prototype: Loader;
    new(fn:Function): Loader;
};

declare const bootstrap: (options: RoboConfig) => Robo;
