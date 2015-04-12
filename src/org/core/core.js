import ScriptLoader from "./net/ScriptLoader";
import EventMap from "./events/EventMap";
import  EventDispatcher from "./events/EventDispatcher";
import Signal from "./events/Signal";
import DomWatcher from "./display/DomWatcher";
import Mediator from "./display/Mediator";
import MediatorsBuilder from "./display/MediatorsBuilder";
import bootstrap from "./display/bootstrap";
import MediatorHandler from "./display/MediatorHandler";
let uid = [
    '0',
    '0',
    '0'
];
function nextUid() {
    "use strict";
    let index = uid.length;
    let digit;
    while (index) {
        index--;
        digit = uid[index].charCodeAt(0);
        if (digit == 57 /*'9'*/) {
            uid[index] = 'A';
            return uid.join('');
        }
        if (digit == 90  /*'Z'*/) {
            uid[index] = '0';
        } else {
            uid[index] = String.fromCharCode(digit + 1);
            return uid.join('');
        }
    }
    uid.unshift('0');
    return uid.join('');
}
var flip = (f) => (...args) =>f.apply(this, args.reverse());


let robojs = {
    MEDIATORS_CACHE: {},
    utils: {
        uid,
        nextUid,
        flip
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
        ScriptLoader
    }

};

if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function(){return robojs});
} else {
    // Browser globals
    window.robojs = robojs;
}

export default robojs;