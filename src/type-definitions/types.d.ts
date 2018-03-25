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

export interface Loader_load {
    (id: any): Promise<Mediator>
}

export interface LoaderDef {
    load: Loader_load
}

export interface MediatorHandlerParams {
    definitions: any,
    dispatcher?: EventTarget
}

export type Handler_getAllElements = (node: HTMLElement) => Array<HTMLElement>;

/**
 * E' la strategia con la quale vengono creati i Mediator. Di default con il meccanismo data-mediator
 */
export interface Handler {
    dispose(): void

    destroy(node: HTMLElement): void

    findMediator: Handler_findMediator,

    hasMediator(node: HTMLElement): boolean

    getAllElements: Handler_getAllElements
}

export interface Handler_findMediator {
    (dispatcher: EventTarget): Function;

    (dispatcher: EventTarget, load: Loader_load): Function;

    (dispatcher: EventTarget, load: Loader_load, node: HTMLElement): Promise<Mediator>;

}

export interface Handler_getDefinition {
    (definitions): any

    (definitions, node: HTMLElement): any
}

/**
 * E' la strategia con la quale ascoltare i cambiamenti del Contesto.
 *
 */
export interface Watcher {
    /**
     * viene dispacciato un signal ogni volta che vengono aggiunti 1 o più nodi
     */
    onAdded: Signal
    /**
     *  viene dispacciato ogni volta che vengono rimossi 1 o più nodi
     */
    onRemoved: Signal

    dispose(): void
}

export interface EventListenerObject {
    handleEvent(evt: Event): void;
}

export interface EventListener {
    (evt: Event): void;
}

declare type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

/**
 * E' l'interfaccia per il dispatcher. Il dispatcher è un'istanza di EventTarget che viene passata
 * ad ogni istanza di Mediator in modo da comunicare tra istanze
 */
export interface EventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    dispatchEvent(eventObj: Event): void
}


export interface Mediator {
    (node: HTMLElement, dispatcher: EventTarget): Function;
}

/**
 * Configurazione per la funzione bootstrap
 *
 */
export interface BootstrapConfig {
    /**
     * la mappa key/value per definire il Mediator
     */
    definitions: any
    /**
     * è la strategia di caricamento dei Mediators. Di default è un caricamento AMD
     */
    loader?: LoaderDef
    /**
     * è il nodo html da osservare per l'istanza di rjs
     */
    root?: HTMLElement
    /**
     * la strategia per recuperare i mediators dal DOM. default con attributo data-mediator
     */
    handler?: Handler
    /**
     * è la strategia per ascoltare i cambiamenti del dom . Default con MutationObserver
     */
    domWatcher?: Watcher
}

/**
 * Disposable è un oggetto creato ogni volta che un Mediator viene istanziato.
 * Viene utilizzato per non istanziare il mediator più volte e per invocare la callback di dispose
 */
export interface Disposable {
    node: HTMLElement,

    dispose (): void,

    mediatorId: String
}
