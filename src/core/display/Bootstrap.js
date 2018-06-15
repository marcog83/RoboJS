/**
 * Created by marco.gobbi on 21/01/2015.
 */

import DomWatcher from "./DomWatcher";
import  {AMDLoader} from "../net/Loader";
import MediatorHandler from "./MediatorHandler";

import { filter, flatten,  map} from "../../internal";

/**
 *
 * @param options {BootstrapConfig}
 * @returns {Bootstrap}
 */

export default class Bootstrap {
    constructor(options) {
        let {definitions, loader = new AMDLoader(), root = document.body} = options;

        this.definitions = definitions;
        this.loader = loader;
        this.root = root;
        /**
         *
         * @type {MediatorHandler}
         */
        this.handler = options.handler || new MediatorHandler({definitions});
        /**
         *
         * @type {DomWatcher}
         */
        this.domWatcher = options.domWatcher || new DomWatcher(root, this.handler.getAllElements.bind(this.handler));
        this.domWatcher.onAdded.connect(this.handleAdded.bind(this));
        this.domWatcher.onRemoved.connect(this.handleRemoved.bind(this));

        this.init();

    }

    init() {

        const nodes = [this.root].map(this.handler.getAllElements.bind(this.handler));
        this.promise = this.getMediators(nodes);
    }

    handleAdded(node) {
        let nodes = flatten(node);
        nodes = filter(this.handler.hasMediator.bind(this.handler), nodes);
        const promises = map(node => {
            return this.loader.load(this.handler.getDefinition(node))
                .then(Mediator => this.handler.create(node, Mediator))
                .then(this.handler.updateCache.bind(this.handler));
        }, nodes);
        return Promise.all(promises);
    }

    handleRemoved(nodes) {
        nodes.forEach(this.handler.destroy.bind(this.handler));

    }

    getMediators(nodes) {
        nodes = flatten(nodes);
        const promises = nodes.filter(this.handler.hasMediator.bind(this.handler))
            .map(this.handler.findMediator.bind(this.handler, this.loader.load.bind(this.loader)));

        return Promise.all(promises);
    }

    dispose() {
        this.domWatcher.dispose();
        this.handler.dispose();
        this.domWatcher = null;
        this.handler = null;

        this.definitions = null;
        this.loader = null;
        this.root = null;
        this.promise = null;
    }
}
//
// export default options => {
//
//
//     let getMediators = GetMediators(handler.findMediator(loader.load), handler.hasMediator);
//
//
//     let promise = Build(getMediators, handler.getAllElements)(root);
//
//     return {
//         promise: promise
//         , dispose: function () {
//             domWatcher.dispose();
//             handler.dispose();
//             domWatcher = null;
//             handler = null;
//             getMediators = null;
//             definitions = null;
//             loader = null;
//             root = null;
//             promise = null;
//         }
//     };
//
// };


