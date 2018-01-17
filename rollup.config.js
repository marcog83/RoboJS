/**
 * Created by marcogobbi on 07/05/2017.
 */

import resolve from 'rollup-plugin-node-resolve';
export default {
    input: 'robojs.js',
    output: {
        format: 'es',
        file: 'dist/robojs.js'
        , name: 'robojs'
        , exports: 'named'
    }
    ,plugins: [resolve()]


};