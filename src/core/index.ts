export {default as Loader} from "./net/Loader";
export {AMDLoader, CustomLoader} from "./net/Loader";

export {default as EventTarget} from "./events/EventTarget";
export {default as Signal} from "./events/Signal";
export {default as DomWatcher} from "./display/DomWatcher";

export {default as MediatorHandler} from "./display/MediatorHandler";
import Bootstrap from "./display/Bootstrap";

export {default as Bootstrap} from "./display/Bootstrap";
export {default as CustomElementHandler} from "./display/CustomElementHandler";

//

export const bootstrap = options => {
    return new Bootstrap(options);
}