import ScriptLoader from "./net/ScriptLoader";
import AMDScriptLoader from "./net/AMDScriptLoader";
import EventMap from "./events/EventMap";
import EventDispatcher from "./events/EventDispatcher";
import Signal from "./events/Signal";
import DomWatcher from "./display/DomWatcher";
import Mediator from "./display/Mediator";
import MediatorsBuilder from "./display/MediatorsBuilder";
import bootstrap from "./display/bootstrap";
import MediatorHandler from "./display/MediatorHandler";


var robojs = {
    MEDIATORS_CACHE: {},
    utils: {
        nextUid: ()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }),
        flip: f => (...args) =>f.apply(this, args.reverse())
    },
    display: {
        DomWatcher,
        Mediator,
        bootstrap,
        MediatorHandler,
        MediatorsBuilder
    },
    events: {
        EventDispatcher,
        EventMap,
        Signal
    },
    net: {
        AMDScriptLoader,
        ScriptLoader
    }

};

export default robojs;