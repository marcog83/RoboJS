/**
 * Created by mgobbi on 20/04/2017.
 */
import _arity from "./_arity";
function _curryN(length, received, fn) {
    return function() {
        const combined = [];
        let argsIdx = 0;
        let left = length;
        let combinedIdx = 0;
        while (combinedIdx < received.length || argsIdx < arguments.length) {
            let result;
            if (combinedIdx < received.length  ) {
                result = received[combinedIdx];
            } else {
                result = arguments[argsIdx];
                argsIdx += 1;
            }
            combined[combinedIdx] = result;
            left -= 1;
            combinedIdx += 1;
        }
        return left <= 0 ? fn.apply(this, combined)
            : _arity(left, _curryN(length, combined, fn));
    };
}
export default _curryN;