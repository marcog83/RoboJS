/**
 * Created by mgobbi on 17/03/2017.
 */
// Performs left-to-right composition of one or more  functions.
import _arity from "./_arity";
export default function (...fns) {
    var ctx = this;
    fns.reverse();
    var head = fns[0];
    var tail = fns.slice(1);

    return _arity(head.length, function (...args) {
        return tail.reduce(function (x, fn) {
            return fn.call(ctx, x);
        }, head.apply(ctx, args));
    })
};

