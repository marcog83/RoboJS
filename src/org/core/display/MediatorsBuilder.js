import curryN from "ramda/src/curryN";
import find from "ramda/src/find";
import compose from "ramda/src/compose";
import map from "ramda/src/map";
import filter from "ramda/src/filter";
import flatten from "ramda/src/flatten";


export default  (domWatcher, loader, definitions)=> {


    //make a copy of definitions map to mutate;
    definitions = Object.create(definitions);


    var findMediators = curryN(2, (definitions, tagName) => {
        var url = definitions[tagName];
        definitions[tagName] = undefined;
        return loader.load(url).then(mediator=>mediator());
    });

    var hasMediator = curryN(2, (definitions, tagName)=> definitions[tagName] != undefined);


    var getMediators = compose(
        Promise.all.bind(Promise),
        map(findMediators(definitions)),
        filter(hasMediator(definitions)),
        map(node=>node.tagName.toLowerCase()),
        flatten()
    );

    domWatcher.onAdded.connect(getMediators);


    var bootstrap = compose(
        getMediators,
        map(node=>[node].concat(Array.prototype.slice.call(node.getElementsByTagName("*"), 0))),
        (root = document.body)=>[root]
    );

    return Object.freeze({bootstrap})

};


