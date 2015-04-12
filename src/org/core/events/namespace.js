import RoboJS from "../core";
import EventMap from "./EventMap";
import  EventDispatcher from "./EventDispatcher";
import Signal from "./Signal";
RoboJS.events = {
    EventDispatcher: EventDispatcher,
    EventMap: EventMap,
    Signal: Signal
};