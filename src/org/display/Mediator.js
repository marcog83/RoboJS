define(["../events/EventDispatcher", "../events/EventMap"], function (EventDispatcher, EventMap) {
    /**
     * <strong>Mediator</strong>
     * <p>Mediators should observe one of the following forms:</p>
     * <ul>
     *     <li>Extend the base mediator class and override <i>initialize()</i> and, if needed, <i>destroy</i>.</li>
     *     <li>Don't extend the base mediator class, and provide functions <i>initialize()</i> and, if needed, also <i>destroy()</i>.</li>
     * </ul>
     *
     * <p>A mediator that extends the Mediator might look like this:</p>
     *
     * <pre>
     * var RoboJS=require("RoboJS");
     * function MediatorA() {
     *    RoboJS.display.Mediator.apply(this, arguments);
     * }
     * MediatorA.prototype = Object.create(RoboJS.display.Mediator.prototype, {
     *     initialize: {
     *         value: function () {
     *             // code goes here
     *        }
     *      }
     * });
     *</pre>
     *
     *<p>You do not have to extend the Mediator:</p>
     *
     * <pre>
     *
     *    function MediatorA() {}
     *
     *    MediatorA.prototype={
     *        initialize:function(){
     *            //your code goes here
     *        }
     *    }
     * </pre>
     *
     */
    function Mediator(element) {
        this.element = element;
        this.eventMap = new EventMap();
        this.eventDispatcher = EventDispatcher.getInstance();
    }

    Mediator.prototype = {
        /**
         * <strong>postDestroy</strong>
         * <p>Runs after the mediator has been destroyed.
         * Cleans up listeners mapped through the local EventMap.</p>
         */
        postDestroy: function () {
            console.log("postDestroy");
            this.eventMap.unmapListeners();
        },
        /**
         * <strong>addContextListener</strong>
         * <p>Syntactical sugar for mapping a listener to an EventDispatcher</p>
         * @param eventString {string}
         * @param listener {function}
         * @param scope {*} the context where 'this' is bind to
         */
        addContextListener: function (eventString, listener, scope) {
            this.eventMap.mapListener(this.eventDispatcher, eventString, listener, scope);
        },
        /**
         *<strong>removeContextListener</strong>
         * <p>Syntactical sugar for unmapping a listener to an EventDispatcher</p>
         * @param eventString {string}
         * @param listener {function}
         */
        removeContextListener: function (eventString, listener) {
            this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
        },
        /**
         *<strong>dispatch</strong>
         *
         * <p>Dispatch helper method</p>
         * @param eventString {string} The Event name to dispatch on the system
         * @param data {*} the data dispatched
         */
        dispatch: function (eventString, data) {
            if (this.eventDispatcher.hasEventListener(eventString)) {
                this.eventDispatcher.dispatchEvent(eventString, data);
            }
        },
        initialize: function () {},
        destroy: function () {}
    };
    return Mediator;
});