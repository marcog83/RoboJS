
export {Loader, AMDLoader, CustomLoader} from "./net/Loader";

export {EventTarget} from "./events/EventTarget";
export {Signal} from "./events/Signal";
export {DomWatcher} from "./display/DomWatcher";

export {MediatorHandler} from "./display/MediatorHandler";
import {Robo} from "./display/Robo";

export {Robo} from "./display/Robo";
export {CustomElementHandler} from "./display/CustomElementHandler";

//

export const bootstrap = options => {
    return new Robo(options);
};