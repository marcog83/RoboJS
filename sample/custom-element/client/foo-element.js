/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


	function FooElement() {
		return {
			createdCallback: function () {
				console.log("created foo element", this);
				this.addEventListener("click",function(e){
					e.currentTarget.parentElement.removeChild(e.currentTarget);
					e.stopPropagation();
				})
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