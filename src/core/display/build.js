/**
 * Created by marcogobbi on 01/04/2017.
 */
import {map,compose} from "../../internal";


/**
 *
 * @param getMediators {function}
 * @param getAllElements {Handler_getAllElements}
 * @return {function}
 */
export default function (getMediators,getAllElements) {
    return compose(
        getMediators,
        map(getAllElements),
        root => [root]
    );
}