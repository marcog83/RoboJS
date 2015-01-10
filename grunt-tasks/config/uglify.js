/**
 * Created by marco on 10/01/2015.
 */
module.exports={
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
    dist: {
        src: ['dist/robojs.js'],
        dest: 'dist/robojs.min.js'
    }
};