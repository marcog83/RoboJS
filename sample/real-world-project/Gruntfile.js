/**
 * Created by marco on 11/01/2015.
 */
var _ = require("lodash");
var REQUIRE_CONFIG = {
    baseUrl: "./js/",
    paths: {
        "jquery": "./bower_components/jquery/dist/jquery.min",
        'jquery-private': "./external_components/jquery/jquery-private",
        RoboJS: "../../dist/robojs.min",
//
        "signals": "./bower_components/signals/dist/signals.min",
        "Promise": "./bower_components/bluebird/js/browser/bluebird",

        //
        "lodash": "./bower_components/lodash/dist/lodash"

    },
    getEmptyPaths: function () {
        return _.mapValues(this.paths, function () {
            return "empty:";
        });
    },
    getLibraries: function () {
        return _.keys(this.paths);
    },
    modules_name: [
        "modules/app-guida-tv/Application",
        "modules/approfondimenti/approfondimenti",
        "modules/canali-opzionali/Application",
        "modules/facebook/facebook",
        "modules/footer/footer",
        "modules/lightbox/lightbox",
        "modules/pacchetti/Application",
        "modules/points-panel/points-panel",
        "modules/sky-hd/Application",
        "modules/telecomando/Application",
        "modules/vedi-tutti-i-video/Application",
        "modules/pop-video/Application",
        "modules/video-player/video-player",
        "modules/tracking/tracking"
    ]
};
var Utils = {

    JS: "js",


    _source_pattern: "{{id}}/",
    _dest_pattern: "{{id}}/",
    getSourcePath: function (id) {
        return this._source_pattern.replace("{{id}}", id);
    },
    getDestPath: function (id) {
        return this._dest_pattern.replace("{{id}}", id);
    },
    getDestRoot: function () {
        return "htdocs/"
    }
};
module.exports = function (grunt) {
    grunt.initConfig({
        requirejs: {
            libraries: {
                options: {
                    baseUrl: "./",
                    out: Utils.getSourcePath(Utils.JS) + "libs/libraries.min.js",
                    paths: REQUIRE_CONFIG.paths,

                    optimize: 'none',

                    include: REQUIRE_CONFIG.getLibraries()
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-requirejs');
};