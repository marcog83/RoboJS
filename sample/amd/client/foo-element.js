/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {


	function FooElement() {
		console.log("element foo creation")
		var proto = Object.create(HTMLElement.prototype);
		proto.createdCallback = function () {
			console.log("created", this)
		};
		proto.attachedCallback = function () {
			console.log("attached", this)
		};
		proto.detachedCallback = function () {
			console.log("deattached", this)
		};
		document.registerElement("foo-element", {prototype: proto})
	}


	module.exports = FooElement;
});