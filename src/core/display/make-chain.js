/**
 * Created by marcogobbi on 01/04/2017.
 */
import {compose, filter, flatten, map, pluck} from "@robojs/internal";

export default function makeChain(prop, getAllElements, emit) {
    return compose(
        nodes => {
            if (nodes.length > 0) {
                return emit(nodes);
            } else {
                return []
            }
        },
        filter(nodes => nodes.length > 0),
        map(getAllElements),
        filter(node => node.querySelectorAll),
        flatten,
        pluck(prop)//"addedNodes","removedNodes"
    )

}