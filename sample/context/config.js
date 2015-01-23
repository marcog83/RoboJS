requirejs.config({
    paths: {
        Promise: "../../bower_components/bluebird/js/browser/bluebird.min",
        robojs: "../../dist/robojs.min",
        jss: "../../bower_components/js-suspenders/dist/js-suspenders",
        'robojs.extensions': "../../dist/robojs.extensions"
    }
});
require([
    "./app/Client"
], function (Client) {
    "use strict";
    Client();
});