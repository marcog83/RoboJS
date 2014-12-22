/**
 * Created by marco.gobbi on 10/11/2014.
 */
require.config({
	paths: {
		lodash: "../bower_components/lodash/dist/lodash.min"
	}
});
require([
	"./client/Application"
], function (Application) {
	"use strict";
	Application.main();
});
