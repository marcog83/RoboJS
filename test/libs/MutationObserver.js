global.MutationObserver = function (callback) {
    this.callback = callback;
};
global.MutationObserver.prototype = {
    disconnect() {
    }
    , observe(root, spec) {
        this.callback(global.mutations || {addedNodes: [], removedNodes: []});
    }
}