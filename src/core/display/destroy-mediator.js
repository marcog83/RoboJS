export default function destroy(node, MEDIATORS_CACHE) {
    const l = MEDIATORS_CACHE.length;
    for (let i = 0; i < l; i++) {
        let disposable = MEDIATORS_CACHE[i];
        if (disposable) {
            if (!disposable.node || disposable.node === node) {
                disposable.dispose && disposable.dispose();
                disposable.node = null;
                MEDIATORS_CACHE[i] = null;
                //MEDIATORS_CACHE.splice(i, 1);
            }
            // if (!disposable.node) {
            //
            //     disposable.dispose && disposable.dispose();
            //     disposable.node = null;
            //     MEDIATORS_CACHE[i] = null;
            //     //MEDIATORS_CACHE.splice(i, 1);
            // }
        } else {

            MEDIATORS_CACHE[i] = null;
            //MEDIATORS_CACHE.splice(i, 1);
        }

    }

    return MEDIATORS_CACHE.filter(i => i);
}