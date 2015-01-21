requirejs.config({
	paths: {
		Promise: "../../bower_components/bluebird/js/browser/bluebird.min",
		RoboJS: "../../dist/robojs.min"
	}
});
require([
	"./app/Client"
], function (Client) {
	"use strict";
	Client();
});