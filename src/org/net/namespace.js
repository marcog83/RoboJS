/**
 * Created by marco on 10/01/2015.
 */
define(["../core", "./ScriptLoader"], function (RoboJS, ScriptLoader) {
    RoboJS.net = {

        ScriptLoader: ScriptLoader,
        GlobalScriptLoader: {}//i'd like to provide a solid lightweight external resources... but at the moment i don't need
    };
});