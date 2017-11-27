/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {

	var rjs=require("robojs");
	function FooElement(dispatcher) {

        this.dispatcher=dispatcher;
        var input=document.createElement("input");
        this.appendChild(input);
        var autocomplete = new google.maps.places.Autocomplete(input);
        google.maps.event.addListener(autocomplete, "place_changed", function (e) {
            this.dispatcher.dispatchEvent(new rjs.RJSEvent("place-changed",autocomplete.getPlace().geometry.location));
        }.bind(this));
	}
	FooElement.prototype={


        connectedCallback: function () {
            console.log("attached foo element", this)
        },
        disconnectedCallback: function () {
            console.log("deattached foo element", this)
        }
    }


	module.exports = FooElement;
});