define(function (require, exports, module) {
    'use strict';
    function ConfigManager(context){
        this.context = context;
        this.injector = context.injector;
    }
    ConfigManager.prototype={

    };
    module.exports = ConfigManager;
});