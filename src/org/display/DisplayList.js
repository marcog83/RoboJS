define(["signals", "lodash"], function (signals, _) {

     function DisplayList() {
        this.onAdded = new signals.Signal();
        this.onRemoved = new signals.Signal();
       /*
       * <strong>MutationObserver</strong><br/> provides developers a way to react to changes in a DOM.<br/>
        * It is designed as a replacement for Mutation Events defined in the DOM3 Events specification.
        * <a href="https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver">docs!</a>
       * */
        var observer = new MutationObserver(this.handleMutations.bind(this));

        /* <strong>Configuration of the observer.</strong><br/>
         Registers the MutationObserver instance to receive notifications of DOM mutations on the specified node.
        */
        observer.observe(document.body, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree:true
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