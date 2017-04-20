/**
 * Created by marcogobbi on 01/04/2017.
 */
import forEach from "../../internal/_for-each";
import flatten from "../../internal/_flatten";
import compose from "../../internal/_compose";

export default function(destroy){
    return compose(
        forEach(destroy),
        flatten
    );
}