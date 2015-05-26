import RoboJS from '../robojs';
import Signal from "../events/Signal";
import R from "ramda";
export default function MediatorsBuilder(domWatcher, loader, mediatorHandler, definitions) {

    var onAdded = Signal(),
        onRemoved = Signal();


    var _handleNodesRemoved = R.compose(
        R.tap(mediators=> (mediators.length && onRemoved.emit())),
        R.forEach(mediatorHandler.destroy),
        R.flatten()
    );


    var findMediators = R.curryN(2, (definitions, node) => {
        var m = node.getAttribute("data-mediator");
        var def = R.find(R.propEq('id', m), definitions);
        return loader.load(def.mediator).then(mediatorHandler.create(node, def));

    });

    var hasMediator = R.curryN(2, (definitions, node)=> {
        var m = node.getAttribute("data-mediator");
        return m && R.containsWith((a, b)=>a.id === b.id, {id: m}, definitions);
    });


    var getMediators = R.compose(
        Promise.all.bind(Promise),
        R.map(findMediators(definitions)),
        R.filter(hasMediator(definitions)),
        R.flatten()
    );
    var _handleNodesAdded = nodes=> getMediators(nodes).then(mediators=>(mediators.length && onAdded.emit(mediators)));

    domWatcher.onAdded.connect(_handleNodesAdded);
    domWatcher.onRemoved.connect(_handleNodesRemoved);

    var _bootstrap = R.compose(
        getMediators,
        R.map(node=>[node].concat([].slice.call(node.getElementsByTagName("*"), 0)))
    );

    return {
        onAdded,
        onRemoved,
        bootstrap: ()=> _bootstrap([document.body])
    }

}


