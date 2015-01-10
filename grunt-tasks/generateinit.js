/**
 * Created by marco on 10/01/2015.
 */
module.exports = function (grunt) {
    var modConfig = grunt.file.readJSON('lib/config-all.json');
    grunt.registerMultiTask('generateinit', 'Generate Init file', function () {
        var requirejs = require('requirejs');
        requirejs.config({
            appDir:__dirname,
            baseUrl: __dirname
        });
        var generateInit = requirejs('../src/generate');

        grunt.file.write('tmp/robojs-init.js', generateInit(modConfig));
    });
};