/**
 * Created by mgobbi on 20/04/2017.
 */
export default function (fn) {
    return function f1(a) {
        if (arguments.length === 0 ) {
            return f1;
        } else {
            return fn.apply(this, arguments);
        }
    };
};