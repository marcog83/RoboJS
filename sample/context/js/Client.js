define(function (require, exports, module) {
    'use strict';

	var AppConfig=require("./AppConfig");
    var RoboJS=require("robojs.extensions");
    //
    function Client(){
	    var _context = new RoboJS.framework.Context();

	    _context.install(RoboJS.extensions.MVCBundle)
		        .configure(["Injector",AppConfig],"AppConfig")
		        .initialize();
    }


    module.exports = Client;
});