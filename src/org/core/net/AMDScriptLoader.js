
export default  Object.freeze({
    load: id=> new Promise((resolve, reject)=> window.require([id], function(response){resolve(response)}))
});
