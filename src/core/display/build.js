/**
 * Created by marcogobbi on 01/04/2017.
 */
import {map,compose} from "../../internal";



export default function (getMediators,getAllElements) {
    return compose(
        getMediators,
        map(getAllElements),
        root => [root]
    );
}