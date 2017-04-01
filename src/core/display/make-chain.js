/**
 * Created by marcogobbi on 01/04/2017.
 */
import map from "ramda/src/map";
import flatten from "ramda/src/flatten";
import pluck from "ramda/src/pluck";
import compose from "ramda/src/compose";
import filter from "ramda/src/filter";
import getAllElements from "./get-all-elements";
export default function makeChain(prop, emit) {
    return compose(
        nodes => {
            if (nodes.length > 0) {
                emit(nodes);
            }
        },
        filter(nodes => nodes.length > 0),
        map(getAllElements),
        filter(node => node.querySelectorAll),
        flatten,
        pluck(prop)//"addedNodes","removedNodes"
    )

}