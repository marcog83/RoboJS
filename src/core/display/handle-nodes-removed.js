/**
 * Created by marcogobbi on 01/04/2017.
 */
import forEach from "ramda/src/forEach";
import flatten from "ramda/src/flatten";
import compose from "ramda/src/compose";

export default function(destroy){
    return compose(
        forEach(destroy),
        flatten
    );
}