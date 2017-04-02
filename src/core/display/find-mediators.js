/**
 * Created by marcogobbi on 02/04/2017.
 */
import curryN from "ramda/src/curryN";
export default (getDefinition, create, updateCache) => {
    return curryN(3, function (dispatcher, load, node) {
        return load(getDefinition(node))
            .then(create(node, dispatcher))
            .then(updateCache);
    })
}