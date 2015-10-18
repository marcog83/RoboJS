
export default  Object.freeze({
    load: id=> new Promise((resolve, reject)=> window.require([id], resolve.bind(resolve)))
});
