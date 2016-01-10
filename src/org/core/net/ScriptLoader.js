function getPromise() {
    if (System.import) {
        return url=> System.import(url);
    } else {
        return url=> Promise.resolve(System.get(url));
    }
}
export default  Object.freeze({
    load: id=> getPromise()(id).then(e=> {
        return e.default ? e.default : e;
    }).catch(e=> {
        console.log(e)
    })
});
