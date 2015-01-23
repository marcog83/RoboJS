/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
	paths: {
		Promise: "../bower_components/bluebird/js/browser/bluebird.min",
		robojs: "../../dist/robojs"

	}
});
require([
	"./client/Application"
], function (Application) {
	"use strict";
	Application.main();
});
