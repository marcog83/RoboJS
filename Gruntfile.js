module.exports = function(grunt) {
    "use strict";
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.initConfig({
        uglify: {
            options: {
                screwIE8: true
            },
            dist: {
                files: {
                    'dist/robojs.es6.min.js': ['dist/robojs.es6.js']
                }
            }
        }
    });
};