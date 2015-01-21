define(function (require, exports, module) {
    'use strict';
    var MediatorMapExtension = {
        extend: function (context) {
            this.injector = context.injector;
            this.injector.map(['DisplayList', 'ScriptLoader','MediatorsMap', MediatorsBuilder], 'MediatorsBuilder').asSingleton();
        },
        initialize: function () {
            var builder = this.injector.getInstance('MediatorsBuilder');
            builder.bootstrap();
        }
    };
    module.exports = MediatorMapExtension;

});