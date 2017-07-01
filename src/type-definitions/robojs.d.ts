/**
 * Created by marcogobbi on 01/07/2017.
 */
import {
    Bootstrap,
    BootstrapConfig,
    LoaderDef,
    Handler,
    EventDispatcher,
    Watcher,
    Handler_getAllElements
} from "./types.d";
export {EventDispatcher, RJSEvent, Signal} from "./types.d";

export function Loader(loaderfn?: (id: any, resolve, reject) => Promise<any>): LoaderDef;

export function makeDispatcher(): EventDispatcher;

export function DomWatcher(root: HTMLElement, getAllElements: Handler_getAllElements): Watcher;
export function MediatorHandler(definitions: any, dispatcher?: EventDispatcher): Handler;
export function bootstrap(config: BootstrapConfig): Bootstrap;
export function CustomElementHandler(definitions: any, dispatcher?: EventDispatcher): Handler;
