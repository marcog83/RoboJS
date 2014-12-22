/**
 * Created by marco.gobbi on 07/11/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var signals = require("../../../bower_components/signals/dist/signals.min");

	function DisplayList() {
		this.onAdded = new signals.Signal();
		this.onRemoved = new signals.Signal();
		// The node to be monitored
// Create an observer instance
		var observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				var newNodes = mutation.addedNodes; // DOM NodeList
				var removedNodes = mutation.removedNodes; // DOM NodeList
				if (newNodes !== null) { // If there are new nodes added
					this.onAdded.dispatch(newNodes);
					// dispatch signal added_to_stage
				}
				if (removedNodes !== null) { // If there are new nodes removed
					this.onRemoved.dispatch(removedNodes);
					// dispatch signal removed_from_stage
				}
			}.bind(this));
		}.bind(this));
// Configuration of the observer:
// Pass in the target node, as well as the observer options
		observer.observe(document.body, {
			attributes: false,
			childList: true,
			characterData: false
		});
	}

	module.exports = DisplayList;
});