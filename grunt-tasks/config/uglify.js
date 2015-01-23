/**
 * Created by marco on 10/01/2015.
 */
module.exports = {

    options: {
        compress: {
            drop_console: true
        },
        sourceMap: true,
        stripbanners: true,
        banner: '<%= banner.compact %>',
        mangle: {
            except: ['RoboJS']
        }
    },
    core: {
        src: ['dist/robojs.js'],
        dest: 'dist/robojs.min.js'
    },
    extensions: {
        src: ['dist/robojs.extensions.js'],
        dest: 'dist/robojs.extensions.min.js'
    }


};