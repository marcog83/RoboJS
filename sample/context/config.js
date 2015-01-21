requirejs.config({
    paths: {
        Promise: "../../bower_components/bluebird/js/browser/bluebird.min",
        RoboJS: "../../dist/robojs.min"

    }
});
require([
    "./client/Application"
], function (Application) {
    "use strict";
    Application.main();
});