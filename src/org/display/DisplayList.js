/**
 * Created by marco.gobbi on 07/11/2014.
 */
define(["signals", "lodash"], function (signals, _) {
    "use strict";


    function DisplayList() {
        this.onAdded = new signals.Signal();
        this.onRemoved = new signals.Signal();
        // The node to be monitored
        // Create an observer instance
        var observer = new MutationObserver(this.handleMutations.bind(this));
        // Configuration of the observer:
        // Pass in the target node, as well as the observer options
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false
        });
    }

    DisplayList.prototype = {
        handleMutations: function (mutations) {
            var response = _.reduce(mutations, function (result, mutation, index) {
                result.addedNodes = result.addedNodes.concat(Array.prototype.slice.call(mutation.addedNodes));
                result.removedNodes = result.removedNodes.concat(Array.prototype.slice.call(mutation.removedNodes));
                return result;
            }, {addedNodes: [], removedNodes: []});
            //
            response.addedNodes.length && this.onAdded.dispatch(response.addedNodes);
            response.removedNodes.length && this.onRemoved.dispatch(response.removedNodes);
        }
    };
   return DisplayList;
});