function getPromise(){
    if (System.import){
        return function(url){

            return System.import(url);
        };
    }else{
        return function(url){
            return Promise.resolve(System.get(url));
        }
    }
}
export default  Object.freeze({
    load: id=> getPromise()(id).then(e=>e.default).catch(function(e){console.log(e)})
});
