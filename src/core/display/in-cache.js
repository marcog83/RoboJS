/**
 * Created by mgobbi on 31/03/2017.
 */
import {find} from "../../internal";

/**
 *
 * @param MEDIATORS_CACHE {Array}
 * @param node {HTMLElement}
 * @return {boolean}
 */
export default (MEDIATORS_CACHE, node) => {
    return !!find(disposable => disposable.node === node, MEDIATORS_CACHE);

};