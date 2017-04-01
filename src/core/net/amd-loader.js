export var amdLoaderFunction=(id,resolve,reject)=>{
    window.require([id],resolve,reject);
};
export default  (loaderFunction=amdLoaderFunction)=>{
    return Object.freeze({
        load: id=> new Promise((resolve, reject)=> loaderFunction(id,resolve,reject))
    });
}
