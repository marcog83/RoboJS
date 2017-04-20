/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {

    return function (node, dispatcher) {
        var autocomplete = new google.maps.places.Autocomplete(node);
        google.maps.event.addListener(autocomplete, "place_changed", function (e) {
            dispatcher.dispatchEvent(new CustomEvent("place-changed", {detail:autocomplete.getPlace().geometry.location}));
        });
    };
});