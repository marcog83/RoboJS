/**
 * Created by mgobbi on 14/03/2017.
 */
import _arity from "./_arity";
import _curryN from "./_curryN";
import _curry1 from "./_curry1";

export default function (fn) {
    var length = fn.length;
    if (length === 1) {
        return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
}