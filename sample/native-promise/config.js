/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
	paths: {

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
