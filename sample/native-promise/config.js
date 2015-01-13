/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
	paths: {

		lodash: "../../bower_components/lodash/dist/lodash.min",
		Promise: "./native-promise",
		RoboJS: "../../dist/robojs.min"

	}
});
require([
	"./client/Application"
], function (Application) {
	"use strict";
	Application.main();
});
