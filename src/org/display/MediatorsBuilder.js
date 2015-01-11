/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(["../core", "./DisplayList", "../net/ScriptLoader", "signals", "lodash", "Promise"], function (RoboJS, DisplayList, ScriptLoader, signals, _, Promise) {
    "use strict";


    function MediatorsBuilder(_definition) {
        this.onAdded = new signals.Signal();
        this.onRemoved = new signals.Signal();
        this.definitions = _definition || [];
        this.displayList = new DisplayList();
        this.displayList.onAdded.add(this._handleNodesAdded, this);
        this.displayList.onRemoved.add(this._handleNodesRemoved, this);
        // by default ScriptLoader is how you will load external scripts.
        this.loader = new ScriptLoader();
    }


    MediatorsBuilder.prototype = {

        bootstrap: function () {

            return this.getMediators([document.body]);
        },
        getMediators: function (target) {
            var promises = _.chain(target)
                .reduce(this._reduceNodes, [])
                .reduce(this._findMediators.bind(this), [])
                .value();
            // find every children
            //
            // find the promises for each Mediator
            // for each node it increase the result Array (3^ parameter) and return it to promises.
            return Promise.all(promises);
        },
        _findMediators: function (result, node, index) {


            // filter definitions based on actual Node
            // once you get the Mediators you need, load the specific script.
            var mediators = _.chain(this.definitions)
                .filter(function (def) {
                    return node.dataset && node.dataset.mediator == def.id;
                })
                .map(function (def) {
                    // prefill _initMediator with node parameter
                    return this.loader.get(def.mediator).then(this._initMediator.bind(this, node));
                }.bind(this)).value();
            // add mediators promise to the result Array
            return result.concat(mediators);
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
                    this.onAdded.dispatch(mediators);
                }
            }.bind(this));
        },
        _handleNodesRemoved: function (nodes) {

            _.chain(nodes)
                .reduce(this._reduceNodes, [])
                .forEach(this._destroyMediator.bind(this))
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

                this.onRemoved.dispatch(mediator);
                mediator.element && (mediator.element = null);
                RoboJS.MEDIATORS_CACHE[mediatorId] = null;
                mediator = null;
            }

        }
    };
    return MediatorsBuilder;
});