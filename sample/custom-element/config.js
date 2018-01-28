/**
 * Created by marco.gobbi on 10/11/2014.
 */



requirejs.config({
    paths: {

        robojs: "../../dist/robojs"

    }
});
require(["./polyfills","require"],function(_,require){
    require(["./application"], function (app) {app()});
})

