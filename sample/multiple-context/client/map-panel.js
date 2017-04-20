/**
 * Created by mgobbi on 12/12/2016.
 */
define(function () {
    return function (node, dispatcher) {
        var map = new google.maps.Map(node, {
            zoom: 8,
            center: {lat: -34.397, lng: 150.644}
        });
        dispatcher.addEventListener("place-changed",function(e){
            var center=e.detail;
            map.setCenter(center);
        })
    };
});