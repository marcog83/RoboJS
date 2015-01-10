/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
	paths: {
		signals: "../bower_components/signals/dist/signals.min",
		lodash: "../bower_components/lodash/dist/lodash.min",
		bluebird: "../bower_components/bluebird/js/browser/bluebird.min"

	}
});
require([
	"./client/Application"
], function (Application) {
	"use strict";
	Application.main();
});
