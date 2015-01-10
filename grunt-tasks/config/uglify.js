/**
 * Created by marco on 10/01/2015.
 */
module.exports={
    options: {
        stripbanners: true,
       // banner: '<%= banner.compact %>',
        mangle: {
            except: ['RoboJS']
        },
        beautify: {
            ascii_only: true
        }
    },
    dist: {
        src: ['dist/robojs-build.js'],
        dest: 'dist/robojs-build.min.js'
    }
};