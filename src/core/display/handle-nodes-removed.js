/**
 * Created by marcogobbi on 01/04/2017.
 */
import {compose, flatten, forEach} from "../../internal";

/**
 *
 * @param destroy {function}
 * @return void;
 */
export default function (destroy) {
    return compose(
        forEach(destroy),
        flatten
    );
}