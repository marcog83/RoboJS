(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(["robojs",'jss'], factory);
	} else {
		  factory(root.RoboJS,root.jss);
	}
}(this, function (RoboJS,jss) {
	'use strict';
