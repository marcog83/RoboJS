define(["../core", "../events/Signal", "Promise"], function (RoboJS, Signal, Promise) {
    /*
     <h2>MediatorsBuilder</h2>
     */
    function MediatorsBuilder(displayList, scriptLoader, mediatorHandler, definitions) {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        this.definitions = definitions || [];
        this.displayList = displayList;
        this.mediatorHandler = mediatorHandler;
        this.displayList.onAdded.connect(this._handleNodesAdded, this);
        this.displayList.onRemoved.connect(this._handleNodesRemoved, this);
        this.loader = scriptLoader;
    }


    MediatorsBuilder.prototype = {

        bootstrap: function () {

            return this.getMediators([document.body]);
        },
        getMediators: function (target) {
            return Promise.all(target
                .reduce(this._reduceNodes, [])
                .reduce(this._findMediators.bind(this), []));
        },
        _findMediators: function (result, node) {
            return result.concat(
                this.definitions.filter(function (def) {
                    return node.dataset && node.dataset.mediator == def.id;
                }).map(function (def) {
                    return this.loader.get(def.mediator).then(this.mediatorHandler.create.bind(this.mediatorHandler, node, def));
                }.bind(this))
            );

        },

        _handleNodesAdded: function (nodes) {
            this.getMediators(nodes).then(function (mediators) {
                if (mediators.length) {
                    this.onAdded.emit(mediators);
                }
            }.bind(this));
        },
        _handleNodesRemoved: function (nodes) {
            nodes.reduce(this._reduceNodes, [])
                .forEach(this._destroyMediator.bind(this));

        },
        _reduceNodes: function (result, node) {
            if (!node || !node.getElementsByTagName)return result;
            var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        },
        _destroyMediator: function (node) {
            var mediator = this.mediatorHandler.destroy(node);
            mediator && this.onRemoved.emit(mediator);


        }
    };
    return MediatorsBuilder;
});