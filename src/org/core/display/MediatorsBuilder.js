import RoboJS from '../robojs';
import Signal from "../events/Signal";
import R from "ramda";
export default function MediatorsBuilder(domWatcher, loader, definitions) {

    var onAdded = Signal();

    var findMediators = R.curryN(2, (definitions, node) => {
        var def = R.find(R.propEq('id', node.tagName.toLowerCase()), definitions);
        return loader.load(def.mediator).then(mediator=> {
            mediator();
            def.loaded = true;
        });
    });

    var hasMediator = R.curryN(2, (definitions, node)=>  R.containsWith((name, b)=>  name === b.id.toLowerCase() && !b.loaded, node.tagName.toLowerCase(), definitions));


    var getMediators = R.compose(
        Promise.all.bind(Promise),
        R.map(findMediators(definitions)),
        R.filter(hasMediator(definitions)),
        R.flatten()
    );
    var _handleNodesAdded = nodes=> getMediators(nodes).then(mediators=>(mediators.length && onAdded.emit(mediators)));

    domWatcher.onAdded.connect(_handleNodesAdded);


    var _bootstrap = R.compose(
        getMediators,
        R.map(node=>[node].concat([].slice.call(node.getElementsByTagName("*"), 0)))
    );

    return {
        onAdded,
        bootstrap: ()=> _bootstrap([document.body])
    }

}


