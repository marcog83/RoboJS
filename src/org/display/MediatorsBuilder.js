define(["../core", "./DisplayList", "../net/ScriptLoader", "../events/Signal", "Promise"], function (RoboJS, DisplayList, ScriptLoader, Signal, Promise) {
    /*
     <h2>MediatorsBuilder</h2>
     */
    function MediatorsBuilder(_definition) {
        this.onAdded = new Signal();
        this.onRemoved = new Signal();
        this.definitions = _definition || [];
        this.displayList = new DisplayList();
        this.displayList.onAdded.connect(this._handleNodesAdded, this);
        this.displayList.onRemoved.connect(this._handleNodesRemoved, this);
        this.loader = new ScriptLoader();
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
        _findMediators: function (result, node, index) {
            return result.concat(this.definitions
                .filter(function (def) {
                    return node.dataset && node.dataset.mediator == def.id;
                })
                .map(function (def) {
                    return this.loader.get(def.mediator).then(this._initMediator.bind(this, node));
                }.bind(this)));

        },
        _initMediator: function (node, Mediator) {
            var mediatorId = RoboJS.utils.nextUid();
            node.dataset = node.dataset || {};
            node.dataset.mediatorId = mediatorId;
            var _mediator = new Mediator(node);
            _mediator.id = mediatorId;
            RoboJS.MEDIATORS_CACHE[mediatorId] = _mediator;
            _mediator.initialize();
            return _mediator;
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
            var mediatorId = node.dataset && node.dataset.mediatorId;
            var mediator = RoboJS.MEDIATORS_CACHE[mediatorId];
            if (mediator) {
                mediator.destroy && mediator.destroy();
                mediator.postDestroy && mediator.postDestroy();
                this.onRemoved.emit(mediator);
                mediator.element && (mediator.element = null);
                RoboJS.MEDIATORS_CACHE[mediatorId] = null;
                mediator = null;
            }

        }
    };
    return MediatorsBuilder;
});