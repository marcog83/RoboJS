/**
 * Created by marco on 10/01/2015.
 */
define(["../core", "./EventMap", "./EventMapConfig","./EventDispatcher"], function (RoboJS, EventMap, EventMapConfig,EventDispatcher) {

    RoboJS.org.events = {
        EventDispatcher: EventDispatcher,
        EventMap: EventMap,
        EventMapConfig: EventMapConfig
    };

});