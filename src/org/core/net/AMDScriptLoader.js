//var System = require('es6-module-loader').System;
export default  {
    load: id=> new Promise((resolve, reject)=> window.require([id], resolve.bind(resolve)))
};
