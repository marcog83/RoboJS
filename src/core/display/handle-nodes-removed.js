/**
 * Created by marcogobbi on 01/04/2017.
 */
import {compose, flatten, forEach} from "@robojs/internal";

export default function (destroy) {
    return compose(
        forEach(destroy),
        flatten
    );
}