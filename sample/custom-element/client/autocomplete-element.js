/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


    function FooElement(dispatcher) {

        this.dispatcher = dispatcher;

    }

    FooElement.prototype = Object.create(HTMLElement.prototype);
    FooElement.prototype.constructor = FooElement;
    Object.assign(FooElement.prototype, {


        connectedCallback: function () {
            console.log("attached foo element", this);
            var input = document.createElement("input");
            this.appendChild(input);
            var autocomplete = new google.maps.places.Autocomplete(input);
            google.maps.event.addListener(autocomplete, "place_changed", function (e) {
                this.dispatcher.dispatchEvent(new CustomEvent("place-changed", {detail:autocomplete.getPlace().geometry.location}));
            }.bind(this));
        },
        disconnectedCallback: function () {
            console.log("deattached foo element", this)
        }
    });


    module.exports = FooElement;
});