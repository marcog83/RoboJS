/**
 * Created by marco.gobbi on 07/01/2015.
 */
define(function (require, exports, module) {
	"use strict";
	function ScriptLoader() {}

	ScriptLoader.prototype = {
		require: function (id) {
			return new Promise(function (resolve, reject) {
				require([id], function (Mediator) {
					resolve(Mediator);
				});
			});
		}
	};
	module.exports = new ScriptLoader();
});