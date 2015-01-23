/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
	'use strict';
	var $ = require("jquery");

	function ToggleModule(element) {

	}

	ToggleModule.prototype = {
		initialize: function (element) {
			element=$(element);
			var JQUERY_MODULE = "<div class='results-panel' data-mediator='jquery-results-panel'></div>";
			var ANGULAR_MODULE = '<div class="results-panel" data-mediator="results-panel"><results-panel class="content"></results-panel></div>';
			element.on("click", function () {
				element.toggleClass("toggled");
				$(".results-panel").remove();
				var new_element, text;
				if (element.hasClass("toggled")) {
					new_element = JQUERY_MODULE;
					text = 'CHANGE TO ANGULAR MODULE';
				} else {
					new_element = ANGULAR_MODULE;
					text = 'CHANGE TO JQUERY MODULE';
				}
				element.html(text);
				$("body").append(new_element);
			}.bind(this))
		}
	}
	module.exports = ToggleModule;
});