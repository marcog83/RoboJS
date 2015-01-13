define([],function () {
    'use strict';


    function Signal() {

        this.listenerBoxes = [];

        this._valueClasses = null;

        this.listenersNeedCloning = false;
        // allow sub classes to pass an array of Classes
        //if (arguments.length == 1 && arguments[0] instanceof Array)
        //setValueClasses(arguments[0])
        //else
        this.setValueClasses(arguments);
    }

    Signal.prototype = {
        getNumListeners: function () {
            return this.listenerBoxes.length;
        },
        getValueClasses: function () {
            return this._valueClasses;
        },
        add: function (listener, scope) {
            this.registerListener(listener, scope, false);
        },
        addOnce: function (listener, scope) {
            this.registerListener(listener, scope, true);
        },
        remove: function (listener, scope) {
            if (listenersNeedCloning) {
                this.listenerBoxes = this.listenerBoxes.slice();
                this.listenersNeedCloning = false;
            }

            for (var i = this.listenerBoxes.length; i--;) {
                if (this.listenerBoxes[i].listener == listener && this.listenerBoxes[i].scope == scope) {
                    this.listenerBoxes.splice(i, 1);
                    return;
                }
            }
        },
        removeAll: function () {
            // Looping backwards is more efficient when removing array items.
            for (var i = this.listenerBoxes.length; i--;) {
                this.remove(this.listenerBoxes[i].listener, this.listenerBoxes[i].scope);
            }
        },
        dispatch: function () {
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
            //var scope;
            this.listenersNeedCloning = true;
            for (var i = 0; i < len; i++) {
                listenerBox = listenerBoxes[i];
                if (listenerBox.once)
                    this.remove(listenerBox.listener, listenerBox.scope);

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