// export {} from "./net/Loader";
export {Loader, AMDLoader, CustomLoader} from "./net/impl/Loader";

export {EventTarget} from "./events/impl/EventTarget";
export {Signal} from "./events/impl/Signal";
export {DomWatcher} from "./display/impl/DomWatcher";

export {MediatorHandler} from "./display/impl/MediatorHandler";
import {Bootstrap} from "./display/impl/Bootstrap";

export {Bootstrap} from "./display/impl/Bootstrap";
export {CustomElementHandler} from "./display/impl/CustomElementHandler";

//

export const bootstrap = options => {
    return new Bootstrap(options);
};