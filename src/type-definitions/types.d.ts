/**
 * Created by marcogobbi on 01/07/2017.
 */
// @flow
/**
 * Signal è un oggetto che viene utilizzato per dispacciare messaggi
 */
export interface Signal {
    /**
     * aggiunge un listener al signal. il listener viene eseguito ogni volta che il signal emitta un messaggio
     * @param {(data?: any) => void} listener
     */
    connect(listener: (data?: any) => void): void

    /**
     * aggiunge un listener al signal, che viene eseguito una volta sola
     * @param {(data?: any) => void} listener
     */
    connectOnce(listener: (data?: any) => void): void

    /**
     * rimuove uno specifico listener al signal
     * @param {Function} slot
     */
    disconnect(slot: Function): void

    /**
     * rimuove tutti i listener associati al signal
     */
    disconnectAll(): void

    /**
     * dispaccia un messaggio a tutti i listener in ascolto, passando come input il valore di data
     * @param data
     */
    emit(data?: any): void
}

/**
 * E' l'oggetto ritornato dalla funzione {bootstrap}
 */
export interface Bootstrap {
    /**
     * è una promessa che viene risolta quando l'istanza di RJS è pronta e caricata
     */
    promise: Promise<any>

    /**
     * distrugge l'istanza di RJS, eliminando ogni referenza dell'istanza di RJS.
     */
    dispose(): void
}

/**
 * è la signature della funzione di load, usata dal loader. In input accetta un parametro, che di default è l'id del tipo di Mediator, e restituisce una promessa che risolve il Mediator
 */
export interface Loader_load {
    (id: any): Promise<Mediator>
}

/**
 * E' l'interfaccia dell'oggetto loader
 */
export interface LoaderDef {
    /**
     * carica il mediatore, passandogli come parametro un id
     */
    load: Loader_load
}

/**
 * sono i parametri passati al MadiatorHandler.
 */
export interface MediatorHandlerParams {
    /**
     * è la mappa delle definizioni dei Mediator
     */
    definitions: any,
    /**
     * E' un'istanza dell'eventTarget. Se non viene passata, una nuova istanza viene creata
     */
    dispatcher?: EventTarget
}

/**
 * dato un HTMLElement, ritorna un array con tutti i suoi figli e il node stesso
 */
export type Handler_getAllElements = (node: HTMLElement) => Array<HTMLElement>;

/**
 * E' la strategia con la quale vengono creati i Mediator. Di default con il meccanismo data-mediator
 */
export interface Handler {
    /**
     * distrugge l'istanza dell'Handler
     */
    dispose(): void

    /**
     * distrugge il Mediator agganciato al node
     * @param {HTMLElement} node
     */
    destroy(node: HTMLElement): void

    /**
     * ritorna una Promise che risolve il Mediator
     */
    findMediator: Handler_findMediator,

    /**
     * controlla se il nodo ha un mediator agganciato
     * @param {HTMLElement} node
     * @return {boolean}
     */
    hasMediator(node: HTMLElement): boolean

    /**
     * ottiene un array di HTMLElement figli ,partendo da un nodo HTMLElement
     */
    getAllElements: Handler_getAllElements
}

/**
 * è la funzione che ritorna una Promise che risolve il mediator per uno specifico node
 */
export interface Handler_findMediator {
    (dispatcher: EventTarget): Function;

    (dispatcher: EventTarget, load: Loader_load): Function;

    (dispatcher: EventTarget, load: Loader_load, node: HTMLElement): Promise<Mediator>;

}

/**
 * ritorna la definizione del Mediator per un node HTMLELement
 */
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

    /**
     * distrugge l'istanza del watcher
     */
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
    /**
     * aggiunge un listener
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean} useCapture
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    /**
     * rimuove un listener
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean} useCapture
     */
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void

    /**
     * dispaccia un evento
     * @param {Event} eventObj
     */
    dispatchEvent(eventObj: Event): void
}

/**
 * Mediato è la funzione che crea un mediator, partendo da un node HTMLElement
 */
export interface Mediator {
    /**
     *
     * @param {HTMLElement} node è l'elemento del dom specifico per quel Mediator
     * @param {EventTarget} dispatcher, è l'istanza del EventTarget
     * @return {Function | void} se ritornata, è la funzione che viene eseguita quando il mediator viene eliminato
     */
    (node: HTMLElement, dispatcher: EventTarget): Function|void;
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
    /**
     * è l'elemeto del dom al quale è agganciato il mediator
     */
    node: HTMLElement,

    /**
     * è la funzione ritornata dal Mediator, se definita.
     */

    dispose (): void,

    /**
     * è l'id creato a runtime per identificare il mediator
     */
    mediatorId: String
}
