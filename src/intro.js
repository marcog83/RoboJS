(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define('robojs',["Promise"], factory);
	} else {
		root.RoboJS = factory(root.Promise);
	}
}(this, function (Promise) {
	'use strict';
