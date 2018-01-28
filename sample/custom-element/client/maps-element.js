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
            console.log("map")
            var map = new google.maps.Map(this, {
                zoom: 8,
                center: {lat: -34.397, lng: 150.644}
            });
            this.dispatcher.addEventListener("place-changed", function (e) {
                var center = e.detail;
                map.setCenter(center);
            })
        },
        disconnectedCallback: function () {
            console.log("deattached foo element", this)
        }
    });


    module.exports = FooElement;
});