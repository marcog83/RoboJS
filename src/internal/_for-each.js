/**
 * Created by mgobbi on 20/04/2017.
 */
import curry from "./_curry";
export default curry(function (fn, list) {
    var len = list.length;
    var idx = 0;
    while (idx < len) {
        fn(list[idx]);
        idx += 1;
    }
    return list;
});