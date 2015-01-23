/**
 * Created by marco on 10/01/2015.
 */
module.exports = function (grunt) {

    grunt.registerMultiTask('generateinit', 'Generate Init file', function () {

        var modConfig = grunt.file.readJSON(this.data.options.modules);
        var requirejs = require('requirejs');
        requirejs.config({
            appDir:__dirname,
            baseUrl: __dirname
        });

        var generateInit = requirejs(this.data.options.script);

        grunt.file.write('tmp/js-init.js', generateInit(modConfig));
    });
};