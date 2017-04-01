/**
 * Created by marcogobbi on 01/04/2017.
 */
export default  (definitions, loader, node) => {
    return loader.load(definitions[node.getAttribute(selector)])
        .then(create(node, dispatcher))
        .then(disposable => {
            MEDIATORS_CACHE.push(disposable);//[mediatorId] = disposeFunction;
        });
}

