(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['lodash',"Promise"], factory);
	} else {
		root.RoboJS = factory(root._,root.Promise);
	}
}(this, function (_,Promise) {
	'use strict';
