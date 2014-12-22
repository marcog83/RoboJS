/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
	"use strict";
	var MediatorsBuilder = require("../org/display/MediatorsBuilder"),
		MediatorsMap = require("./MediatorsMap");
	var EventDispatcher = require("../org/events/EventDispatcher");

	function getRandomArbitrary(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	}

	function Application() {
		this.eventDispatcher = EventDispatcher.getInstance();
	}

	Application.prototype = {
		main: function () {
			var builder = new MediatorsBuilder(MediatorsMap);
			builder.getMediators().then(function (_instances) {
				console.log("Mediators loaded", _instances);
			}).catch(function (e) {
				console.log(e);
			});
			builder.onAdded.add(function (mediators) {
				console.log("Mediator:" + mediators[0]._handleEvento == mediators[1]._handleEvento);
				console.log("Mediator:" + mediators[0]._handleEvento === mediators[1]._handleEvento);
				console.log("Mediators added async", mediators);
			});
			/*builder.onRemoved.add(function (mediator) {
			 console.log("Mediators onRemoved async", mediator);
			 });*/
			$(".add-button").on("click", function () {
				var elements = [];
				elements.push($("<div data-mediator='mediator-a'><ul><li>lista a caso</li></ul></div>"));
				elements.push($("<div>" +
				"<ul data-mediator='mediator-b'>" +
				"<li>lista a caso</li>" +
				"</ul>" +

				"</div>"));
				elements.push($("<div data-mediator='mediator-a'>primo nodo</div><div data-mediator='mediator-c'>mediator c</div><span data-mediator='mediator-b'></span>"));
				var index = getRandomArbitrary(0, 2);
				console.log(index);
				var element = elements[index];
				element.click(function (e) {
					element.remove();
					e.preventDefault();
					e.stopPropagation();
				});
				$("body").append(element);
			});
			setInterval(function () {
				this.eventDispatcher.dispatchEvent("evento", {name: "evento"});
			}.bind(this), 4000);
		}
	};
	return new Application();
});