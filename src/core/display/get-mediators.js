/**
 * Created by marcogobbi on 01/04/2017.
 */
import {compose, filter, flatten, map} from "../../internal";

export default function (findMediator, hasMediator) {
    return compose(
        promises => Promise.all(promises)
        , map(findMediator),
        filter(hasMediator),
        flatten
    );
}