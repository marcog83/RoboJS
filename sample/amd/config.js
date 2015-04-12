/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
	paths: {
		//Promise: "../bower_components/bluebird/js/browser/bluebird.min",
		robojs: "./bundle"

	}
});
require([
	"./client/Application"
], function (Application) {
	"use strict";
	Application.main();
});
