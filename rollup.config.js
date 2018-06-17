/**
 * Created by marcogobbi on 07/05/2017.
 */

import typescript from 'rollup-plugin-typescript';
export default {
    input: 'src/index.ts',
    output: {
        format: 'es',
        file: 'dist/robojs.js'
        , name: 'robojs'
        , exports: 'named'
    }
    ,plugins: [typescript({
        typescript: require('typescript')
        ,tsconfig:false
    })]


};