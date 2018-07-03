/**
 * Created by mgobbi on 14/03/2017.
 */
import _arity from "./_arity";
import _curryN from "./_curryN";
import _curry1 from "./_curry1";
//  declare function  _arity0  () : any;
// declare function  _arity1  (a0) : any;
// declare function  _arity2  (a0, a1) : any;
// declare function  _arity3  (a0, a1, a2) : any;
// declare function  _arity4  (a0, a1, a2, a3) : any;
// declare function  _arity5  (a0, a1, a2, a3, a4) : any;
// declare function  _arity6  (a0, a1, a2, a3, a4, a5) : any;
// declare function  _arity7  (a0, a1, a2, a3, a4, a5, a6) : any;
// declare function  _arity8  (a0, a1, a2, a3, a4, a5, a6, a7) : any;
// declare function  _arity9  (a0, a1, a2, a3, a4, a5, a6, a7, a8) : any;
type  _arity10=  (a0?, a1?, a2?, a3?, a4?, a5?, a6?, a7?, a8?, a9?) => any;
export default function (fn):  _arity10 {
    const length = fn.length;
    if (length === 1) {
        return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
}