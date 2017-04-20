/**
 * Created by mgobbi on 12/04/2017.
 */
//  function flatten(arr) {
//     return arr.reduce(function (flat, toFlatten) {
//         return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
//     }, []);
// }
import _isArrayLike from "./_isArrayLike";
function flatten(list) {
    var value, jlen, j;
    var result = [];
    var idx = 0;
    var ilen = list.length;

    while (idx < ilen) {
        if (_isArrayLike(list[idx])) {
            value = flatten(list[idx]);
            j = 0;
            jlen = value.length;
            while (j < jlen) {
                result[result.length] = value[j];
                j += 1;
            }
        } else {
            result[result.length] = list[idx];
        }
        idx += 1;
    }
    return result;
};
export default flatten;