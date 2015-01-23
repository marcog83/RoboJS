define(["robojs", "./MediatorHandler"], function (RoboJS, MediatorHandler) {
    'use strict';
    var MediatorMapExtension = {
        extend: function (context) {
            this.injector = context.injector;
            // map how to handle Mediator Creation
            this.injector.map([
                "Injector",
                MediatorHandler
            ], "MediatorHandler").asSingleton();

            // map MediatorsBuilder
            this.injector.map([
                'DisplayList',
                'ScriptLoader',
                'MediatorHandler',
                'MediatorsMap',
                RoboJS.display.MediatorsBuilder
            ], 'MediatorsBuilder').asSingleton();

            this.injector.map(RoboJS.events.EventMap, 'EventMap');
        },
        initialize: function () {
            // when all dependencies are ready, bootstrap MediatorsBuilder
            var builder = this.injector.getInstance('MediatorsBuilder');
            builder.bootstrap();
        }
    };
    return MediatorMapExtension;
});