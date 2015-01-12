(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['lodash',"signals","Promise"], factory);
	} else {
		root.RoboJS = factory(root._,root.signals,root.Promise);
	}
}(this, function (_,signals,Promise) {
	'use strict';
