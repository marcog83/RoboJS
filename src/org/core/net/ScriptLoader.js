function getPromise(){
    if (System.import){
        return url=> System.import(url);
    }else{
        return url=> Promise.resolve(System.get(url));
    }
}
export default  Object.freeze({
    load: id=> getPromise()(id).then(e=>e.default).catch(e=>{console.log(e)})
});
