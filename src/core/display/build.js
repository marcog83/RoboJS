/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "../../internal/_map";
import compose from "../../internal/_compose";


export default function (getMediators,getAllElements) {
    return compose(
        getMediators,
        map(getAllElements),
        root => [root]
    );
}