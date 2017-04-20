/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "../../internal/_map";

import flatten from "../../internal/_flatten";
import compose from "../../internal/_compose";
import filter from "../../internal/_filter";
export default function (findMediator, hasMediator) {
    return compose(
        promises => Promise.all(promises)
        , map(findMediator),
        filter(hasMediator),
        flatten
    );
}