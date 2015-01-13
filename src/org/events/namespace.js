define(["../core", "./EventMap", "./EventMapConfig", "./EventDispatcher","./Signal"], function (RoboJS, EventMap, EventMapConfig, EventDispatcher,Signal) {
    /*

     * <strong>RoboJS.events</strong> package contains
     * <ul>
     *     <li>EventDispatcher</li>
     *     <li>EventMap</li>
     *     <li>EventMapConfig</li>
     * </ul>
     *
     * */
    RoboJS.events = {
        EventDispatcher: EventDispatcher,
        EventMap: EventMap,
        EventMapConfig: EventMapConfig,
        Signal: Signal
    };

});