/**
 * Created by marcogobbi on 02/04/2017.
 */
import {curry} from "../../internal";

/**
 *
 * @param getDefinition {Handler_getDefinition}
 * @param create {function}
 * @param updateCache {function}
 * @return {Handler_findMediator}
 */
export default (getDefinition, create, updateCache) => {
    return curry(function (dispatcher, load, node) {
        return load(getDefinition(node))
            .then(create(node, dispatcher))
            .then(updateCache);
    });
};