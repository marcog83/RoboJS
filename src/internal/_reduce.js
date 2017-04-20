/**
 * Created by marcogobbi on 20/04/2017.
 */
import curry from "./_curry";

export default curry(function (xf, acc, list) {
    var idx = 0;
    var len = list.length;
    while (idx < len) {
        acc = xf(acc, list[idx]);

        idx += 1;
    }
    return acc;

    /* var result=head.apply(ctx, args);
     var idx = 0;
     var len = tail.length;
     while (idx < len){

         result=tail[i].call(ctx, result);
         i--;
     }
     return result;*/
})