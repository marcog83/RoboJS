/**
 * Created by marcogobbi on 02/04/2017.
 */
import {curry} from "../../internal";

/**
 *
 * @param getDefinition {function}
 * @param create {function}
 * @param updateCache {function}
 * @return {function}
 */
export default (getDefinition, create, updateCache) => {
    return curry(function (dispatcher, load, node) {
        return load(getDefinition(node))
            .then(create(node, dispatcher))
            .then(updateCache);
    })
}