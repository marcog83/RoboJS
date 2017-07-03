/**
 * Created by marco.gobbi on 10/11/2014.
 */
requirejs.config({
    paths: {

        robojs: "./robojs"

    }
});
require(["./client/application"], function (app) {app()});
