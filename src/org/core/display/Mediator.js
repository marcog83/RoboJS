define([], function () {
	/**
	 * <h2>Mediator</h2>
	 * <p>Mediators should observe one of the following forms:</p>
	 * <ul>
	 *     <li>Extend the base mediator class and override <code>initialize()</code> and, if needed, <code>destroy()</code>.</li>
	 *     <li>Don't extend the base mediator class, and provide functions <code>initialize()</code> and, if needed, also <code>destroy()</code>.</li>
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
	function Mediator(eventDispatcher, eventMap) {

		this.eventMap = eventMap;//new EventMap();
		this.eventDispatcher = eventDispatcher; //EventDispatcher.getInstance();
	}

	Mediator.inherit = function (scope, args) {

		Mediator.apply(scope,Array.prototype.slice.call(args,-2));
	};
	Mediator.prototype = {
		/**
		 * <h3>postDestroy</h3>
		 * <p>Runs after the mediator has been destroyed.
		 * Cleans up listeners mapped through the local <code>eventMap</code>.</p>
		 */
		postDestroy: function () {
			console.log("postDestroy");
			this.eventMap.unmapListeners();
		},
		/**
		 * <h3>addContextListener</h3>
		 * <p>Syntactical sugar for mapping a listener to an <code>EventDispatcher</code></p>
		 * @param eventString <code>String</code>
		 * @param listener <code>Function</code>
		 * @param scope <code>*</code> the context where 'this' is bind to
		 */
		addContextListener: function (eventString, listener, scope) {
			this.eventMap.mapListener(this.eventDispatcher, eventString, listener, scope);
		},
		/**
		 *<h3>removeContextListener</h3>
		 * <p>Syntactical sugar for unmapping a listener to an <code>EventDispatcher</code></p>
		 * @param eventString <code>String</code>
		 * @param listener <code>Function</code>
		 */
		removeContextListener: function (eventString, listener) {
			this.eventMap.unmapListener(this.eventDispatcher, eventString, listener);
		},
		/**
		 *<h3>dispatch</h3>
		 *
		 * <p>Dispatch helper method</p>
		 * @param eventString <code>String</code> The Event name to dispatch on the system
		 * @param data <code>*</code> the data dispatched
		 */
		dispatch: function (eventString, data) {
			if (this.eventDispatcher.hasEventListener(eventString)) {
				this.eventDispatcher.dispatchEvent(eventString, data);
			}
		},
		/**
		 * <h3>initialize</h3>
		 * Initializes the mediator. This is run automatically by the <code>mediatorBuilder</code> when a mediator is created.
		 * Normally the <code>initialize</code> function is where you would add handlers using the <code>eventMap</code>.
		 */
		initialize: function (node) {
			this.element = node;
		},
		/**
		 * <h3>destroy</h3>
		 * Destroys the mediator. This is run automatically by the <code>mediatorBuilder</code> when a mediator is destroyed.
		 * You should clean up any handlers that were added directly (<code>eventMap</code> handlers will be cleaned up automatically).
		 */
		destroy: function () {}
	};
	return Mediator;
});