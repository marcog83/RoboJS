/* @flow  */

import {DomWatcher} from "./DomWatcher";
import {AMDLoader} from "../net/Loader";
import {MediatorHandler} from "./MediatorHandler";

import flatten from "../internal/_flatten";


export class Robo  {


    constructor(options) {
        let {definitions, loader = new AMDLoader(), root = document.body} = options;

        this.definitions = definitions;
        this.loader = loader;
        this.root = root;

        this.handler = options.handler || new MediatorHandler({definitions});

        this.watcher = options.watcher || new DomWatcher(root, this.handler);
        this.watcher.onAdded.connect(this.getMediators.bind(this));
        this.watcher.onRemoved.connect(this.removeMediators.bind(this));

        this.init();

    }

    init() {

        const nodes= [this.root].map(this.handler.getAllElements.bind(this.handler));
        this.promise = this.getMediators(nodes);
    }

    getMediators(nodes) {
        nodes = flatten(nodes);
        const promises = nodes.filter(this.handler.hasMediator.bind(this.handler))
            .map(node => {
                const definition = this.handler.getDefinition(node);
                return this.loader.load(definition)
                    .then(Mediator => this.handler.create(node, Mediator));

            });
        return Promise.all(promises);
    }

    removeMediators(nodes) {
        nodes.forEach(this.handler.destroy.bind(this.handler));
    }


    dispose() {
        this.watcher.dispose();
        this.handler.dispose();
        this.watcher = null;
        this.handler = null;

        this.definitions = null;
        this.loader = null;
        this.root = null;
        this.promise = null;
    }
}



