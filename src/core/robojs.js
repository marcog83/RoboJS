import Loader from "./net/loader";
import AmdLoader from "./net/amd-loader";
import EventDispatcher from "./events/event-dispatcher";
import {makeDispatcher} from "./events/event-dispatcher";
import RJSEvent from "./events/rjs-event";
import Signal from "./events/signal";
import DomWatcher from "./display/dom-watcher";
// import CustomElementHandler from "./display/CustomElementHandler";
import MediatorHandler from "./display/mediator-handler";
import bootstrap from "./display/bootstrap";

export default {
    bootstrap
    , MediatorHandler
    // , CustomElementHandler
    , DomWatcher
    , Signal
    , RJSEvent
    , makeDispatcher
    , EventDispatcher
    , Loader
    , AmdLoader
}
