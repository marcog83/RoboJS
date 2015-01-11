/*
 RoboJS is a library that aims to dynamically load JS modules depending on how the DOM is composed.
 Add a node to the DOM and a JS will be loaded!
 Remove a node and the JS will be disposed!!
 */
(function (root, factory) {
	// Uses AMD or browser globals to create a module.
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lodash',"signals","Promise"], factory);
	} else {
		// Browser globals
		root.RoboJS = factory(root._,root.signals,root.Promise);
	}
}(this, function (_,signals,Promise) {
	'use strict';
