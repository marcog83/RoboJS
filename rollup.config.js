/**
 * Created by marcogobbi on 07/05/2017.
 */

import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'robojs.ts',
    output: {
        format: 'es',
        file: 'dist/robojs.js'
        , name: 'robojs'
        , exports: 'named'
    }
    , plugins: [typescript()]


};