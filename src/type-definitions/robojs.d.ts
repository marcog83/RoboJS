/**
 * Created by marcogobbi on 01/07/2017.
 */
// @flow
import {
    Bootstrap,
    BootstrapConfig,
    LoaderDef,
    Handler,
    EventDispatcher,
    Watcher,
    Handler_getAllElements
} from "./types.d";
export {EventDispatcher, Signal} from "./types.d";

export type  Loader = (loaderfn?: (id: any, resolve, reject) => Promise<any>) => LoaderDef;

export type  makeDispatcher = () => EventDispatcher;

export type  DomWatcher = (root: HTMLElement, getAllElements: Handler_getAllElements) => Watcher;
export type  MediatorHandler = (definitions: any, dispatcher?: EventDispatcher) => Handler;
export type  bootstrap = (config: BootstrapConfig) => Bootstrap;
export type  CustomElementHandler = (definitions: any, dispatcher?: EventDispatcher) => Handler;
