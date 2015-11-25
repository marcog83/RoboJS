module.exports = function (grunt) {
    "use strict";
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.initConfig({
        uglify: {
            options: {
                screwIE8: true,
                compress: {
                    cascade: true,
                    join_vars: true,
                    if_return: true,
                    unused: true,
                    loops: true,
                    booleans: true,
                    evaluate: true,
                    comparisons: true,
                    conditionals: true,
                    drop_debugger: true,
                    sequences: true,
                    properties: true,
                    dead_code: true
                }
            },
            dist: {
                files: {
                    'dist/robojs.es6.min.js': ['dist/robojs.es6.js']
                }
            }
        }
    });
};