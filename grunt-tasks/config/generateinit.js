/**
 * Created by marco on 10/01/2015.
 */
module.exports ={
    core: {
        options:{
            modules:'lib/config-all.json',
            script:'../src/generate'
        },
        src: ['tmp/js-init.js']
    },
    extensions:{
        options:{
            modules:'lib/config-all-extensions.json',
            script:'../src/generate-extensions'
        },
        src:['tmp/js-init.js']
    }
}