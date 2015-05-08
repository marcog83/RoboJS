function getPromise(){
    if (System.import){
        return System.import.bind(System);
    }else{
        return function(url){
            return Promise.resolve(System.get(url));
        }
    }
}
export default  {
    load: id=> getPromise()(id).then(e=>e.default).catch(console.log.bind(console))
};
