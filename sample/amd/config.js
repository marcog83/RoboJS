/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
    paths: {

        robojs: "./robojs.es6"

    },
    maps: {
        "*": {
            "robojs": "src/org/core/core"
        }
    }
});
require([
    "./client/Application"
], function (Application) {
    "use strict";
    Application.main();
});
