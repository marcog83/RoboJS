define(["../events/EventDispatcher", "../events/EventMap"], function (EventDispatcher, EventMap) {
    /**

     * @param element {HTMLElement}
     *
     * @property element {HTMLElement}
     * @property eventMap {EventMap}
     * @property eventDispatcher {EventDispatcher}
     */
    function Mediator(element) {
        this.element = element;
        this.eventMap = new EventMap();
        this.eventDispatcher = EventDispatcher.getInstance();
    }

    Mediator.prototype = {
        /**
         * @method
         */
        postDestroy: function () {
            console.log("postDestroy");
            this.eventMap.unmapListeners();
        },
        /**
         *
         * @param eventString {string}
         * @param listener {function}
         * @param scope {*} the context where 'this' is bind to
         */
        addContextListener: function (eventString, listener, scope) {
            this.eventMap.mapListener(this.eventDispatcher, eventString, listener, scope);
        },
        /**
         *
         * @param eventString {string}
         * @param listener {function}
         */
        removeContextListener: function (eventString, listener) {
            this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
        },
        /**
         *
         * @param eventString {string}
         * @param data {*}
         */
        dispatch: function (eventString, data) {
            if (this.eventDispatcher.hasEventListener(eventString)) {
                this.eventDispatcher.dispatchEvent(eventString, data);
            }
        },
        /**
         *
         */
        initialize: function () {
            console.log("Mediator", this);
        },
        /**
         *
         */
        destroy: function () {
            //
        }
    };
    return Mediator;
});