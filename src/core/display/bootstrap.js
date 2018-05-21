/**
 * Created by marco.gobbi on 21/01/2015.
 */

import DomWatcher from "./dom-watcher";
import Loader from "../net/loader";
import MediatorHandler from "./mediator-handler";

import GetMediators from "./get-mediators";
import HandleNodesRemoved from "./handle-nodes-removed";
import Build from "./build";

/**
 *
 * @param options {BootstrapConfig}
 * @returns {Bootstrap}
 */

class Bootstrap {
    constructor(options) {
        let {definitions, loader = new Loader(), root = document.body} = options;

        this.definitions = definitions;
        this.loader = loader;
        this.root = root;
        this.handler = options.handler ||  new MediatorHandler({definitions});
        this.domWatcher = options.domWatcher || new DomWatcher(root, this.handler.getAllElements);
    }
}

export default options => {

    let handler = options.handler || MediatorHandler({definitions});
    let domWatcher = options.domWatcher || DomWatcher(root, handler.getAllElements);
    //


    let getMediators = GetMediators(handler.findMediator(loader.load), handler.hasMediator);

    domWatcher.onAdded.connect(getMediators);
    domWatcher.onRemoved.connect(HandleNodesRemoved(handler.destroy));

    let promise = Build(getMediators, handler.getAllElements)(root);

    return {
        promise: promise
        , dispose: function () {
            domWatcher.dispose();
            handler.dispose();
            domWatcher = null;
            handler = null;
            getMediators = null;
            definitions = null;
            loader = null;
            root = null;
            promise = null;
        }
    };

};


