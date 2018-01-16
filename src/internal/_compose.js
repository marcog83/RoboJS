/**
 * Created by mgobbi on 17/03/2017.
 */
// Performs left-to-right composition of one or more  functions.
import _arity from "./_arity";
import reduce from "./_reduce";
import _pipe from "./_pipe";

export default function (...fns) {

    fns.reverse();
    var head = fns[0];
    var tail = fns.slice(1);


    return _arity(head.length, reduce(_pipe, head, tail));
};

