import ScriptLoader from "./net/ScriptLoader";
import AMDScriptLoader from "./net/AMDScriptLoader";
import EventDispatcher from "./events/EventDispatcher";
import Signal from "./events/Signal";
import DomWatcher from "./display/DomWatcher";
import MediatorsBuilder from "./display/MediatorsBuilder";
import bootstrap from "./display/bootstrap";

var _robojs = {
    ScriptLoader,
    AMDScriptLoader,
    EventDispatcher,
    Signal,
    DomWatcher,
    MediatorsBuilder,
    bootstrap
};
export var robojs = Object.freeze(_robojs);