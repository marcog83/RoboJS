define(function (require, exports, module) {
    'use strict';
    var MyAppConfig=require("./Config");
    var MVCBundle=require("./MVCBundle");
    //
    var _context = new Context()
        .install(MVCBundle)
        .configure(MyAppConfig,"MyAppConfig")
        .initialize();
    module.exports = {};
});