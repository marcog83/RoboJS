/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {


	function FooElement() {
		console.log("element foo creation")
		var proto = Object.create(HTMLElement.prototype);
		proto.createdCallback = function () {
			console.log("created", this);
			this.addEventListener("click",function(e){
				e.currentTarget.parentElement.removeChild(e.currentTarget);
			})
		};
		proto.attachedCallback = function () {
			console.log("attached", this)
		};
		proto.detachedCallback = function () {
			console.log("detachedCallback", this)
		};
		document.registerElement("foo-element", {prototype: proto})
	}


	module.exports = FooElement;
});