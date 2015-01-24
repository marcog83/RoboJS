/**
 * Created by marco on 10/01/2015.
 */
module.exports ={
    core: {
        options:{
            modules:'lib/config-all.json',
            script:'../lib/generate'
        },
        src: ['tmp/js-init.js']
    },
    extensions:{
        options:{
            modules:'lib/config-all-extensions.json',
            script:'../lib/generate'
        },
        src:['tmp/js-init.js']
    }
}