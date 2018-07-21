/**
 * Created by marcogobbi on 20/04/2017.
 */
import curry from "./_curry";

export default curry(function (xf, acc, list) {
    let idx = 0;
    const len = list.length;
    while (idx < len) {
        acc = xf(acc, list[idx]);

        idx += 1;
    }
    return acc;

});