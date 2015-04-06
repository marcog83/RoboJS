define(["../core", "../events/Signal", "Promise"], function (RoboJS, Signal, Promise) {
    /*
     <h2>MediatorsBuilder</h2>
     */
    function MediatorsBuilder(displayList, loader, mediatorHandler, definitions) {
        var onAdded = new Signal();
        var onRemoved = new Signal();

        displayList.onAdded.connect(_handleNodesAdded);
        displayList.onRemoved.connect(_handleNodesRemoved);

        function _filterDefintions(node, def) {
            return node.getAttribute("data-mediator") == def.id;

        }

        function _createMediator(node, def) {
            return loader.get(def.mediator).then(mediatorHandler.create.bind(null, node, def));
        }

        function _findMediators(result, node) {
            var mediators = definitions
                .filter(_filterDefintions.bind(null, node))
                .map(_createMediator.bind(null, node));
            return result.concat(mediators);

        }

        function getMediators(target) {
            return Promise.all(target
                .reduce(_reduceNodes, [])
                .reduce(_findMediators, []));
        }

        function _handleNodesAdded(nodes) {
            getMediators(nodes).then(_emitAddedSignal);
        }

        function _emitAddedSignal(mediators) {
            if (mediators.length) {
                onAdded.emit(mediators);
            }
        }

        function _handleNodesRemoved(nodes) {
            nodes.reduce(_reduceNodes, [])
                .forEach(_destroyMediator);

        }

        function _reduceNodes(result, node) {
            if (!node || !node.getElementsByTagName)return result;
            var n = [].slice.call(node.getElementsByTagName("*"), 0);
            n.unshift(node);
            return result.concat(n);
        }

        function _destroyMediator(node) {
            var mediator = mediatorHandler.destroy(node);
            mediator && onRemoved.emit(mediator);
        }

        return {
            onAdded: onAdded,
            onRemoved: onRemoved,
            bootstrap: function () {
                return getMediators([document.body])
            }
        }

    }


    return MediatorsBuilder;
});