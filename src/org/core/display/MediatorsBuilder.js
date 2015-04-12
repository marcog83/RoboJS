import RoboJS from '../core';
import Signal from "../events/Signal";
export default function MediatorsBuilder(displayList, loader, mediatorHandler, definitions) {
    let onAdded = Signal(),
        onRemoved = Signal(),
        _emitAddedSignal = (mediators)=> {
            if (mediators.length)  onAdded.emit(mediators);
        },


        _filterDefinitions = (node, def)=>  node.getAttribute("data-mediator") == def.id,
        _createMediator = (node, def)=> loader.load(def.mediator).then(mediatorHandler.create.bind(null, node, def)),
        _findMediators = (result, node) =>result.concat(definitions.filter(_filterDefinitions.bind(null, node)).map(_createMediator.bind(null, node))),
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
        getMediators = (target) => Promise.all(target.reduce(_reduceNodes, []).reduce(_findMediators, [])),
        _handleNodesAdded = (nodes)=> getMediators(nodes).then(_emitAddedSignal),
        _handleNodesRemoved = (nodes)=>  nodes.reduce(_reduceNodes, []).forEach(_destroyMediator);

    displayList.onAdded.connect(_handleNodesAdded);
    displayList.onRemoved.connect(_handleNodesRemoved);


    return {
        onAdded,
        onRemoved,
        bootstrap: ()=> getMediators([document.body])
    }

}


