define(function (require, exports, module) {
    'use strict';

	var Config=require("./Config");
    var RoboJS=require("robojs.extensions");
    //
    function Client(){
	    var _context = new RoboJS.framework.Context();

	    _context.install(RoboJS.extensions.MVCBundle)
		        .configure(["Injector",Config],"MyAppConfig")
		        .initialize();
    }


    module.exports = Client;
});