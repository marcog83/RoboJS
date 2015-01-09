/**
 * Created by marco.gobbi on 09/01/2015.
 */
var path = require('path');
module.exports = function(grunt) {


	require('load-grunt-config')(grunt, {
		// path to task.js files, defaults to grunt dir
		configPath: path.join(process.cwd(), 'grunt-tasks/config')

	});

};