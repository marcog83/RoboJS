/**
 * Created by marco on 10/01/2015.
 */
module.exports = {
    core: {
        options: {
            dir: 'build',
            appDir: '.',
            baseUrl: 'src',
            optimize: 'none',
            optimizeCss: 'none',
            useStrict: true,
            paths: {

                Promise:"empty:",


                'js-init': '../tmp/js-init'
            },
            modules: [{
                'name': 'js-build',
                'include': ['js-init'],
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
    },
    extensions: {
        options: {
            dir: 'build',
            appDir: '.',
            baseUrl: 'src',
            optimize: 'none',
            optimizeCss: 'none',
            useStrict: true,
            paths: {

                jss:"empty:",
	            robojs:"empty:",
                Promise:"empty:",


                'js-init': '../tmp/js-init'
            },
            modules: [{
                'name': 'js-build',
                'include': ['js-init'],
                'create': true
            }],
            fileExclusionRegExp: /^(.git|node_modules|bower_components|grunt-tasks|dist|test|sample)$/,
            wrap: {
                startFile: "src/intro.extensions.js",
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