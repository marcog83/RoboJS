
import Loader from "../net/Loader";

import IHandler from "./IHandler";
import IWatcher from "./IWatcher";

export default interface IBootstrap {
    handler: IHandler;
    definitions: Object;
    loader: Loader;
    root: HTMLElement;
    domWatcher: IWatcher;
    promise: Promise<any>;

    getMediators(nodes: Array<HTMLElement>): Promise<Array<any>>;

    handleRemoved(nodes: Array<HTMLElement>): void;



    dispose(): void;
}