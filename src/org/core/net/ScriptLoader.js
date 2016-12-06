function defaultLoader(id) {
    var getPromise = function () {
        if (System.import) {
            return url=> System.import(url);
        } else {
            return url=> Promise.resolve(System.get(url));
        }
    };
    return getPromise()(id).then(e=> {
        return e.default ? e.default : e;
    }).catch(e=> {
        console.log(e);
    })

}
export default  (loaderFunction = defaultLoader)=> {
    return Object.freeze({
        load: loaderFunction
    })
};
