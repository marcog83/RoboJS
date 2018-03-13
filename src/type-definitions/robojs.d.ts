/**
 * Created by marcogobbi on 01/07/2017.
 */
// @flow
import {
    Bootstrap,
    BootstrapConfig,
    LoaderDef,
    Handler,
    EventTarget,
    Watcher,
    Handler_getAllElements,
    MediatorHandlerParams
} from "./types.d";
export {EventTarget, Signal} from "./types.d";

export type  Loader = (loaderfn?: (id: any, resolve, reject) => Promise<any>) => LoaderDef;

export type  makeDispatcher = () => EventTarget;

export type  DomWatcher = (root: HTMLElement, getAllElements: Handler_getAllElements) => Watcher;
export type  MediatorHandler = (MediatorHandlerParams) => Handler;
export type  bootstrap = (config: BootstrapConfig) => Bootstrap;
export type  CustomElementHandler = (definitions: any, dispatcher?: EventTarget) => Handler;
