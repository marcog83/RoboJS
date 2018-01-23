function Signal() {

    this.listenerBoxes = [];


    this.listenersNeedCloning = false;


}

Signal.prototype = {
    getNumListeners: function () {
        return this.listenerBoxes.length;
    },

    connect: function (slot, scope) {
        this.registerListener(slot, scope, false);
    },

    connectOnce: function (slot, scope) {
        this.registerListener(slot, scope, true);
    },

    disconnect: function (slot, scope) {
        if (this.listenersNeedCloning) {
            this.listenerBoxes = this.listenerBoxes.slice();
            this.listenersNeedCloning = false;
        }

        for (var i = this.listenerBoxes.length; i--;) {
            if (this.listenerBoxes[i].listener == slot && this.listenerBoxes[i].scope == scope) {
                this.listenerBoxes.splice(i, 1);
                return;
            }
        }
    },

    disconnectAll: function () {

        for (var i = this.listenerBoxes.length; i--;) {
            this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
        }
    },

    emit: function (...args) {
        this.listenersNeedCloning = true;
        this.listenerBoxes.forEach(({scope, listener, once}) => {
            if (once) {
                this.disconnect(listener, scope);
            }
            listener.apply(scope, args)
        });

        this.listenersNeedCloning = false;
    },

    registerListener: function (listener, scope, once) {
        const _listeners = this.listenerBoxes.filter(box => box.listener === listener && box.scope === scope);

        if (!_listeners.length) {
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
            }

            this.listenerBoxes.push({listener, scope, once});
        } else {
            //
            const addOnce_add = _listeners.find(box => box.once && !once);
            const add_addOnce = _listeners.find(box => once && !box.once);

            if (!!addOnce_add) {
                throw new Error('You cannot addOnce() then try to add() the same listener ' +
                    'without removing the relationship first.');
            }
            if (!!add_addOnce) {
                throw new Error('You cannot add() then addOnce() the same listener ' +
                    'without removing the relationship first.');
            }
        }

    }
};


export default Signal;