/**
 * Created by mgobbi on 20/04/2017.
 */
import curry from "./_curry";
export default curry((fn, list) => {
    let idx = 0;
    const len = list.length;
    const result = [];

    while (idx < len) {
        if (fn(list[idx])) {
            result[result.length] = list[idx];
        }
        idx += 1;
    }
    return result;
    //  return Array.from(list).filter(fn);

});