/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "ramda/src/map";
import compose from "ramda/src/compose";
import getAllElements from "./get-all-elements";

export default function (getMediators) {
    return compose(
        getMediators,
        map(getAllElements),
        root => [root]
    );
}