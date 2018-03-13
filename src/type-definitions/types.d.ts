/**
 * Created by marcogobbi on 01/07/2017.
 */
// @flow
export interface Signal {
    connect(listener: (data?: any) => void): void

    connectOnce(listener: (data?: any) => void): void

    disconnect(slot: Function): void

    disconnectAll(): void

    emit(data?: any): void
}

export interface Bootstrap {
    promise: Promise<any>

    dispose(): void
}

export type Loader_load = (id: any) => Promise<Function>;

export interface LoaderDef {
    load: Loader_load
}

export interface MediatorHandlerParams {
    definitions: any
    ,
    dispatcher?: EventTarget
}

export type Handler_getAllElements = (node: HTMLElement) => Array<HTMLElement>

export interface Handler {
    dispose(): void

    destroy(node: HTMLElement): void

    findMediator(load: Loader_load, node: HTMLElement): Promise<Function>,

    hasMediator(node: HTMLElement): boolean

    getAllElements: Handler_getAllElements
}

export interface Watcher {
    onAdded: Signal
    onRemoved: Signal

    dispose(): void
}

interface EventListenerObject {
    handleEvent(evt: Event): void;
}

interface EventListener {
    (evt: Event): void;
}

declare type EventListenerOrEventListenerObject = EventListener | EventListenerObject;


export interface EventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    dispatchEvent(eventObj: Event): void
}

export interface BootstrapConfig {
    definitions: any
    loader?: LoaderDef
    root?: HTMLElement
    handler?: Handler
    domWatcher?: Watcher
}

export interface Disposable {
    node: HTMLElement,
    dispose: Function,
    mediatorId: String
}
