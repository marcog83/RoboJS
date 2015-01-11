/**
 * Created by marco on 10/01/2015.
 */
module.exports = {
    compile: {
        options: {
            dir: 'build',
            appDir: '.',
            baseUrl: 'src',
            optimize: 'none',
            optimizeCss: 'none',
            useStrict: true,
            paths: {
                signals:"empty:",
                lodash:"empty:",
                Promise:"empty:",


                'robojs-init': '../tmp/robojs-init'
            },
            modules: [{
                'name': 'robojs-build',
                'include': ['robojs-init'],
                'create': true
            }],
            fileExclusionRegExp: /^(.git|node_modules|bower_components|grunt-tasks|dist|test|sample)$/,
            wrap: {
                startFile: "src/intro.js",
                endFile: "src/outro.js"
            },
            onBuildWrite: function (id, path, contents) {
                if ((/define\(.*?\{/).test(contents)) {
                    //Remove AMD ceremony for use without require.js or almond.js
                    contents = contents.replace(/define\(.*?\{/, '');

                    contents = contents.replace(/\}\);\s*?$/, '');

                    //remove last return statement and trailing })
                    contents = contents.replace(/return.*[^return]*$/, '');
                }
                else if ((/require\([^\{]*?\{/).test(contents)) {
                    contents = contents.replace(/require[^\{]+\{/, '');
                    contents = contents.replace(/\}\);\s*$/, '');
                }

                return contents;
            }
        }
    }
};