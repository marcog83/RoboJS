(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lodash',"signals","Promise"], factory);
	} else {
		// Browser globals
		root.RoboJS = factory(root._,root.signals,root.Promise);
	}
}(this, function (_,signals,Promise) {
	'use strict';
