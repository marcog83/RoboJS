/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "../../internal/_map";
import pluck from "../../internal/_pluck";
import compose from "../../internal/_compose";
import flatten from "../../internal/_flatten";
import filter from "../../internal/_filter";

export default function makeChain(prop,getAllElements, emit) {
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