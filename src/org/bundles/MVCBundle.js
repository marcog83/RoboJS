define(function (require, exports, module) {
    'use strict';


    var MVCBundle = {
        extend: function (context) {
            context.install(
                MediatorMapExtension,
                EventDispatcherExtension
            );
        }
    };
    module.exports = MVCBundle;
});