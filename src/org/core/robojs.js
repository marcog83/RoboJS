import ScriptLoader from "./net/ScriptLoader";
import AMDScriptLoader from "./net/AMDScriptLoader";
import EventDispatcher from "./events/EventDispatcher";
import Signal from "./events/Signal";
import DomWatcher from "./display/DomWatcher";
import MediatorsBuilder from "./display/MediatorsBuilder";
import bootstrap from "./display/bootstrap";


var robojs = {
    MEDIATORS_CACHE: {},
    utils: {
        flip: f => (...args) =>f.apply(this, args.reverse())
    },
    display: {
        DomWatcher,
        bootstrap,
        MediatorsBuilder
    },
    events: {
        EventDispatcher,
        Signal
    },
    net: {
        AMDScriptLoader,
        ScriptLoader
    }

};

export default robojs;