export default function destroy(node, MEDIATORS_CACHE) {
    var l = MEDIATORS_CACHE.length;
    for (let i = 0; i < l; i++) {
        var disposable = MEDIATORS_CACHE[i];
        if (!!disposable) {
            if (disposable.node === node) {
                disposable.dispose && disposable.dispose();
                disposable.node = null;
                MEDIATORS_CACHE[i] = null;
                //MEDIATORS_CACHE.splice(i, 1);
            }
            if (!disposable.node) {
                console.log("no node",disposable,node)
                disposable.dispose && disposable.dispose();
                disposable.node = null;
                MEDIATORS_CACHE[i] = null;
                //MEDIATORS_CACHE.splice(i, 1);
            }
        } else {

            MEDIATORS_CACHE[i] = null;
            //MEDIATORS_CACHE.splice(i, 1);
        }

    }

    return MEDIATORS_CACHE.filter(i => i);
}