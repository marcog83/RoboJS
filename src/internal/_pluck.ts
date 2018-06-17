/**
 * Created by mgobbi on 20/04/2017.
 */
import map from "./_map";
import curry from "./_curry";
export default curry(function (p, list) {
    return map(function (obj) {
        return obj[p];
    }, list);
});