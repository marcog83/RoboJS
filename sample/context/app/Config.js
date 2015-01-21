/**
 * Created by marco.gobbi on 21/01/2015.
 */
define(function (require) {
	"use strict";
	var MediatorsMap = require("./MediatorsMap");

	function Config(injector) {
		this.injector = injector;
	}

	Config.prototype = {
		configure: function () {
			// configure your app dependencies;
			// mediators list
			this.injector.map('MediatorsMap').toValue(MediatorsMap);
		},
		initialize: function () {
			//initialize all
		}
	};
	return Config;
});