import Signal from "../events/Signal";
import curryN from "ramda/src/curryN";
import find from "ramda/src/find";
import propEq from "ramda/src/propEq";
import containsWith from "ramda/src/containsWith";
import compose from "ramda/src/compose";
import map from "ramda/src/map";
import filter from "ramda/src/filter";
import flatten from "ramda/src/flatten";
//import {curryN,find,propEq,containsWith,compose,map,filter,flatten} from "ramda";

export default function MediatorsBuilder(domWatcher, loader, definitions) {

    var onAdded = Signal();

    var findMediators = curryN(2, (definitions, node) => {
        var def = find(propEq('id', node.tagName.toLowerCase()), definitions);
        return loader.load(def.mediator).then(mediator=> {
            mediator();
            def.loaded = true;
        });
    });

    var hasMediator = curryN(2, (definitions, node)=>  containsWith((name, b)=>  name === b.id.toLowerCase() && !b.loaded, node.tagName.toLowerCase(), definitions));


    var getMediators = compose(
        Promise.all.bind(Promise),
        map(findMediators(definitions)),
        filter(hasMediator(definitions)),
        flatten()
    );
    var _handleNodesAdded = nodes=> getMediators(nodes).then(mediators=>(mediators.length && onAdded.emit(mediators)));

    domWatcher.onAdded.connect(_handleNodesAdded);


    var _bootstrap = compose(
        getMediators,
        map(node=>[node].concat(Array.prototype.slice.call(node.getElementsByTagName("*"),0)))
    );

    return Object.freeze({
        onAdded,
        bootstrap: ()=> _bootstrap([document.body])
    })

};


