/**
 * Created by marco on 10/01/2015.
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('stripdefine', 'Strip define call from dist file', function () {
        this.filesSrc.forEach(function (filepath) {
            // Remove `define('robojs-init' ...)` and `define('robojs-build' ...)`
            var mod = grunt.file.read(filepath).replace(/define\("robojs-(init|build)", function\(\)\{\}\);/g, '');


            grunt.file.write(filepath, mod);
        });
    });
};