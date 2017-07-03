/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {

	var rjs=require("robojs");
	function FooElement(dispatcher) {
		return {
			createdCallback: function () {
				var input=document.createElement("input");
				this.appendChild(input);
				var autocomplete = new google.maps.places.Autocomplete(input);
				google.maps.event.addListener(autocomplete, "place_changed", function (e) {
					dispatcher.dispatchEvent(new rjs.RJSEvent("place-changed",autocomplete.getPlace().geometry.location));
				}.bind(this));
			},

			attachedCallback: function () {
				console.log("attached foo element", this)
			},
			detachedCallback: function () {
				console.log("deattached foo element", this)
			}
		}


	}


	module.exports = FooElement;
});