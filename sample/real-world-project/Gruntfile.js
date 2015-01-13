/**
 * Created by marco on 11/01/2015.
 */
var _ = require("lodash");
var REQUIRE_CONFIG = {
    baseUrl: "./js/",
    paths: {
        "jquery": "./bower_components/jquery/dist/jquery.min",
        'jquery-private': "./external_components/jquery/jquery-private",
         RoboJS: "../../dist/robojs",
        "Promise": "./bower_components/bluebird/js/browser/bluebird",
        "rx": "./bower_components/rxjs/dist/rx.all.min",
        "angular": "./bower_components/angular/angular.min",

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
    modules_name: []
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
                    shim: {
                        angular: {
                            deps: ["jquery"],
                            exports: "angular"
                        }
                    },
                    optimize: 'none',

                    include: REQUIRE_CONFIG.getLibraries()
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-requirejs');
};