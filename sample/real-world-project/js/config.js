/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
    paths: {
        // libraries is created by Grunt and contains all common libs for the project
        libraries: "./libs/libraries.min"
    }
});
require(["require", "libraries"], function (require) {
    "use strict";
    require(["RoboJS",
        "./MediatorsMap"
    ], function (RoboJS, Map) {
        var builder = new RoboJS.display.MediatorsBuilder(Map);
        builder.bootstrap();
    })

});
