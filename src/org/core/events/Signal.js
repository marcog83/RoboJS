define([], function () {
     /*
     <h2>Signal</h2>
     <p>Signals and slots are used for communication between objects. The signals and slots mechanism is a central feature of Qt </p>
     <p>A <code>signal</code> is emitted when a particular event occurs.
     A <code>slot</code> is a function that is called in response to a particular <code>signal</code>.
     You can connect as many signals as you want to a single slot, and a signal can be connected to as many slots as you need.

     </p>


      */
    function Signal() {

        this.listenerBoxes = [];

        this._valueClasses = null;

        this.listenersNeedCloning = false;

        this.setValueClasses(arguments);
    }

    Signal.prototype = {
        getNumListeners: function () {
            return this.listenerBoxes.length;
        },
        getValueClasses: function () {
            return this._valueClasses;
        },
        /**
         <h3>connect</h3>
         <p>Connects the signal this to the incoming slot.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connect: function (slot, scope) {
            this.registerListener(slot, scope, false);
        },
        /**
         <h3>connectOnce</h3>
         <p></p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
        connectOnce: function (slot, scope) {
            this.registerListener(slot, scope, true);
        },
        /**
         <h3>disconnect</h3>
         <p>the given slot are disconnected.</p>
         @param <code>Function</code> the slot function
         @param <code>Object</code> the scope of slot function execution
         */
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
        /**
         <h3>disconnectAll</h3>
         <p>Disconnects all slots connected to the signal.</p>

         */
        disconnectAll: function () {

            for (var i = this.listenerBoxes.length; i--;) {
                this.disconnect(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        },
        /**
         <h3>emit</h3>
         <p>Dispatches an event into the signal flow.</p>

         */
        emit: function () {
            var valueObject;
            for (var n = 0; n < this._valueClasses.length; n++) {
                if (this.primitiveMatchesValueClass(arguments[n], this._valueClasses[n]))
                    continue;

                if ((valueObject = arguments[n]) == null || valueObject instanceof this._valueClasses[n])
                    continue;

                throw new Error('Value object <' + valueObject
                + '> is not an instance of <' + this._valueClasses[n] + '>.');
            }

            var listenerBoxes = this.listenerBoxes;
            var len = listenerBoxes.length;
            var listenerBox;

            this.listenersNeedCloning = true;
            for (var i = 0; i < len; i++) {
                listenerBox = listenerBoxes[i];
                if (listenerBox.once)
                    this.disconnect(listenerBox.listener, listenerBox.scope);

                listenerBox.listener.apply(listenerBox.scope, arguments);
            }
            this.listenersNeedCloning = false;
        },
        primitiveMatchesValueClass: function (primitive, valueClass) {
            if (typeof(primitive) == "string" && valueClass == String
                || typeof(primitive) == "number" && valueClass == Number
                || typeof(primitive) == "boolean" && valueClass == Boolean)
                return true;

            return false;
        },
        setValueClasses: function (valueClasses) {
            this._valueClasses = valueClasses || [];

            for (var i = this._valueClasses.length; i--;) {
                if (!(this._valueClasses[i] instanceof Function))
                    throw new Error('Invalid valueClasses argument: item at index ' + i
                    + ' should be a Class but was:<' + this._valueClasses[i] + '>.');
            }
        },
        registerListener: function (listener, scope, once) {
            for (var i = 0; i < this.listenerBoxes.length; i++) {
                if (this.listenerBoxes[i].listener == listener && this.listenerBoxes[i].scope == scope) {
                    if (this.listenerBoxes[i].once && !once) {
                        throw new Error('You cannot addOnce() then try to add() the same listener ' +
                        'without removing the relationship first.');
                    }
                    else if (once && !this.listenerBoxes[i].once) {
                        throw new Error('You cannot add() then addOnce() the same listener ' +
                        'without removing the relationship first.');
                    }
                    return;
                }
            }
            if (this.listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
            }

            this.listenerBoxes.push({listener: listener, scope: scope, once: once});
        }
    };


    return Signal;
});