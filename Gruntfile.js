/**
 * Created by marco.gobbi on 09/01/2015.
 */
var path = require('path');
module.exports = function (grunt) {

    grunt.loadTasks('grunt-tasks');
    require('load-grunt-config')(grunt, {
        // path to task.js files, defaults to grunt dir
        configPath: path.join(process.cwd(), 'grunt-tasks/config'),
//can post process config object before it gets passed to grunt
        postProcess: function (config) {
            config.pkg = grunt.file.readJSON('package.json');
            config.banner = {
                compact: '/*! <%= pkg.name %> <%= pkg.version %> (RoboJS Build) | <%= pkg.license %> */',
                full: '/** RoboJS full build **/'
            }
        }
    });

// Build
    grunt.registerTask('build-core', [
        'generateinit:core',
        'requirejs:core',
        'copy:core',
        'clean:postbuild',
        'stripdefine:core',
       // 'docker:app',
        'uglify:core'
    ]);
    grunt.registerTask('build-extensions', [
        'generateinit:extensions',
        'requirejs:extensions',
        'copy:extensions',
        'clean:postbuild',
        'stripdefine:extensions',

        'uglify:extensions'
    ]);
};