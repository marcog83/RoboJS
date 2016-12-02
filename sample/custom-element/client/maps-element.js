/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


	function FooElement() {
		return {
			createdCallback: function () {

			},
			attachedCallback: function () {
				console.log("map")
				var map = new google.maps.Map(this, {
					zoom: 8,
					center: {lat: -34.397, lng: 150.644}
				});
				this.dispatcher.addEventListener("place-changed",function(e){
					var center=e.data;
					map.setCenter(center);
				})
			},
			detachedCallback: function () {
				console.log("deattached foo element", this)
			}
		}


	}


	module.exports = FooElement;
});