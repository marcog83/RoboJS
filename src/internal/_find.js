/**
 * Created by mgobbi on 20/04/2017.
 */
import curry from "./_curry";
export default curry(function (fn, list) {
    var idx = 0;
    var len = list.length;
    while (idx < len) {
        if (fn(list[idx])) {
            return list[idx];
        }
        idx += 1;
    }
})