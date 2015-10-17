import ScriptLoader from "./net/ScriptLoader";
import AMDScriptLoader from "./net/AMDScriptLoader";
import EventDispatcher from "./events/EventDispatcher";
import Signal from "./events/Signal";
import DomWatcher from "./display/DomWatcher";
import MediatorsBuilder from "./display/MediatorsBuilder";
import bootstrap from "./display/bootstrap";


var robojs = Object.freeze({
    MEDIATORS_CACHE: {},
    utils: {
        flip: f => (...args) =>f.apply(this, args.reverse())
    },
    display: Object.freeze({
        DomWatcher,
        bootstrap,
        MediatorsBuilder
    }),
    events: Object.freeze({
        EventDispatcher,
        Signal
    }),
    net: Object.freeze({
        AMDScriptLoader,
        ScriptLoader
    })

});

export default robojs;