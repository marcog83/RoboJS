/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "ramda/src/map";

import flatten from "ramda/src/flatten";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";
export default function (findMediator, hasMediator) {
    return compose(
        promises => Promise.all(promises)
        , map(findMediator),
        filter(hasMediator),
        flatten
    );
}