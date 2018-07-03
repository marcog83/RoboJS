
import {ILoader} from "../../net/api/ILoader";

import {IHandler} from "./IHandler";
import {IWatcher} from "./IWatcher";

export  interface IBootstrap {
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