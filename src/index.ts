export {default as Loader} from "./net/Loader";
export {AMDLoader, CustomLoader} from "./net/Loader";

export {default as EventTarget} from "./events/EventTarget";
export {default as Signal} from "./events/Signal";
export {default as DomWatcher} from "./display/impl/DomWatcher";

export {default as MediatorHandler} from "./display/impl/MediatorHandler";
import Bootstrap from "./display/impl/Bootstrap";

export {default as Bootstrap} from "./display/impl/Bootstrap";
export {default as CustomElementHandler} from "./display/impl/CustomElementHandler";

//

export const bootstrap = options => {
    return new Bootstrap(options);
};