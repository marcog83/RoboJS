export interface IRobo {
    handler: IHandler;
    definitions: Object;
    loader: ILoader;
    root: HTMLElement;
    domWatcher: IWatcher;
    promise: Promise<any>;

    getMediators(nodes: Array<HTMLElement>): Promise<Array<any>>;

    handleRemoved(nodes: Array<HTMLElement>): void;


    dispose(): void;
}

export interface IDisposable {
    mediatorId: string;
    node: HTMLElement;
    dispose: (_?: any) => any;
}

export declare class Disposable implements IDisposable {
    mediatorId: string;
    node: HTMLElement;
    dispose: (_?: any) => any;

    constructor({mediatorId, node, dispose}?: {
        mediatorId?: string;
        node?: any;
        dispose?: (_: any) => any;
    });
}

export interface IHandler {


    getDefinition(node: HTMLElement): any;


    hasMediator(node: HTMLElement): boolean;


    create(node: HTMLElement, Mediator): IDisposable;

    getAllElements(node: HTMLElement): Element[];

    destroy(node: HTMLElement): void;

    dispose(): void;
}

export interface IWatcher {
    onAdded: ISignal;
    onRemoved: ISignal;

    dispose(): void;
}

export declare class AHandler implements IHandler {
    definitions: {};
    dispatcher: EventTarget;

    constructor(params: any);

    getDefinition(node: any): any;

    inCache(node: any): boolean;

    updateCache(disposable: IDisposable): void;

    hasMediator(node: any): boolean;

    create(node: HTMLElement, Mediator: any): IDisposable;

    getAllElements(node: HTMLElement): Array<Element>;

    /**
     *
     * @param node
     */
    destroy(node: HTMLElement): void;

    dispose(): void;
}

export interface RoboConfig {
    handler?: IHandler;
    definitions: any;
    loader?: ILoader;
    root?: HTMLElement;
    domWatcher?: IWatcher;
}

export declare class Robo implements IRobo {
    handler: IHandler;
    definitions: Object;
    loader: ILoader;
    root: HTMLElement;
    domWatcher: IWatcher;
    promise: Promise<any>;

    constructor(options: RoboConfig);

    init(): void;

    getMediators(nodes: Array<Element>): Promise<IDisposable[]>;

    handleRemoved(nodes: Array<HTMLElement>): void;

    dispose(): void;
}

export declare class CustomElementHandler extends AHandler {
    REGISTERED_ELEMENTS: Object;

    constructor(params: any);

    updateCache(id: any): Object;

    inCache(id: any): boolean;

    getDefinition(node: any): any;

    create(node: any, Mediator: any): IDisposable;

    hasMediator(node: any): boolean;

    getAllElements(node: any): any[];

    dispose(): void;

    destroy(): void;
}

export declare class DomWatcher implements IWatcher {
    onAdded: ISignal;
    onRemoved: ISignal;
    root: HTMLElement;
    handler: IHandler;
    observer: MutationObserver;

    constructor(root: any, handler: IHandler);

    init(): void;

    handleMutations(mutations: Array<MutationRecord>): void;

    getAdded(addedNodes: any): void;

    getRemoved(removedNodes: any): void;

    dispose(): void;
}

export declare class MediatorHandler extends AHandler {
    MEDIATORS_CACHE: Array<IDisposable>;
    definitions: Object;
    dispatcher: EventTarget;

    constructor(params?: {});

    readonly selector: string;

    getDefinition(node: HTMLElement): any;

    inCache(node: HTMLElement): boolean;

    updateCache(disposable: IDisposable): IDisposable[];

    hasMediator(node: HTMLElement): boolean;

    create(node: HTMLElement, Mediator: any): IDisposable;

    getAllElements(node: HTMLElement): Array<Element>;

    static disposeMediator(disposable: IDisposable): void;

    _destroy(node: HTMLElement): IDisposable[];

    destroy(node: HTMLElement): IDisposable[];

    dispose(): void;
}

export declare const nextUid: () => string;

export interface ISignal {
    connect(slot: Function, scope?: any): void;

    connectOnce(slot: Function, scope?: any): void;

    emit(...args: any[]): void;

    disconnect(slot: Function, scope?: any): void;

    disconnectAll(): void;
}

export declare class EventTarget {
    listeners_: Object;

    constructor();

    addEventListener(type: any, handler: any): void;

    removeEventListener(type: any, handler: any): void;

    dispatchEvent(event: any): boolean;
}

export declare class Signal implements ISignal {
    listenerBoxes: Array<any>;
    listenersNeedCloning: boolean;

    constructor();

    getNumListeners(): number;

    connect(slot: any, scope?: any): void;

    connectOnce(slot: any, scope?: any): void;

    disconnect(slot: any, scope?: any): void;

    disconnectAll(): void;

    emit(...args: any[]): void;

    registerListener(listener: any, scope: any, once: any): void;
}

export interface ILoader {
    load(id: string): Promise<any>
}

export declare class Loader implements ILoader {
    constructor();

    load(id: any): Promise<{}>;

    onComplete(id: any, resolve: any, reject: any): void;
}

export declare class AMDLoader extends Loader {
    onComplete(id: any, resolve: any, reject: any): void;
}

export declare class CustomLoader extends Loader {
    fn: Function;

    constructor(fn: any);

    onComplete(id: any, resolve: any, reject: any): void;
}

export declare const bootstrap: (options: RoboConfig) => Robo;
