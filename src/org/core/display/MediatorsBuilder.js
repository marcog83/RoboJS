import RoboJS from '../core';
import Signal from "../events/Signal";
import R from "ramda";
export default function MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions) {

    let onAdded = Signal(),
        onRemoved = Signal(),
        _emitAddedSignal = (mediators)=> {
            if (mediators.length)  onAdded.emit(mediators);
        },
        _filterDefinitions = R.curryN(2, (node, def)=>  node.getAttribute("data-mediator") == def.id),
        _createMediator = R.curryN(2, (node, def)=>  loader.load(def.mediator).then(mediatorHandler.create( node, def)) ),
        _reduceNodes = (result, node)=> {
            if (!node || !node.getElementsByTagName)return result;
            let n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
        _destroyMediator = (node)=> {
            let mediator = mediatorHandler.destroy(node);
            mediator && onRemoved.emit(mediator);
        },


        _handleNodesRemoved = R.compose(
            R.forEach(_destroyMediator),
            R.reduce(_reduceNodes, [])
        );


    let _findMediators = (result, node) => {
        "use strict";
        let _composedFindMediator = R.compose(
            R.map(_createMediator(node)),
            R.filter(_filterDefinitions(node))
        );
        return result.concat(_composedFindMediator(definitions));
    };

    let _promiseReduce = R.compose(
        R.reduce(_findMediators, []),
        R.reduce(_reduceNodes, [])
    );
    let getMediators = (target) => Promise.all(_promiseReduce(target));
    let _handleNodesAdded = (nodes)=> getMediators(nodes).then(_emitAddedSignal);

    domWatcher.onAdded.connect(_handleNodesAdded);
    domWatcher.onRemoved.connect(_handleNodesRemoved);


    return {
        onAdded,
        onRemoved,
        bootstrap: ()=> getMediators([document.body])
    }

}


