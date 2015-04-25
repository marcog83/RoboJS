//var System = require('es6-module-loader').System;
export default  {
    load: (id)=>   new Promise(function (resolve, reject) {
        window.require([id], function (Mediator) {
            resolve(Mediator);
        });
    })
};
