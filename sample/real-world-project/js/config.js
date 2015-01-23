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
    require(["robojs",
        "./MediatorsMap"
    ], function (RoboJS, Map) {
        RoboJS.display.bootstrap({definitions:Map});

    })

});
