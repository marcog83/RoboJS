/**
 * Created by marcogobbi on 02/04/2017.
 */
import {curry} from "../../internal";

export default (getDefinition, create, updateCache) => {
    return curry(function (dispatcher, load, node) {
        return load(getDefinition(node))
            .then(create(node, dispatcher))
            .then(updateCache);
    })
}