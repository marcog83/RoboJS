/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "../../internal/_map";
import compose from "../../internal/_compose";
import getAllElements from "./get-all-elements";

export default function (getMediators) {
    return compose(
        getMediators,
        map(getAllElements),
        root => [root]
    );
}