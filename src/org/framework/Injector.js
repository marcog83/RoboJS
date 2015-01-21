define(function (require, exports, module) {
    'use strict';
    function Injector() {
        this.instanceCache = {};
        this.providerCache = {};
    }

    Injector.prototype = {

        invoke: function (target, scope) {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var FN_ARG_SPLIT = /,/;
            var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var text = target.toString();
            var argNames = text.match(FN_ARGS)[1].split(',');


            var args = argNames.map(function (argName) {
                if (this.instanceCache.hasOwnProperty(argName)) {
                    return this.instanceCache[argName];
                } else if (this.providerCache.hasOwnProperty(argName)) {
                    var provider = this.providerCache[argName];
                    var instance = this.invoke(provider);
                   // this.instanceCache[argName] = instance;
                    return instance;
                }
            }.bind(this));
            return fn.apply(scope, args);
        },
        factory: function (name, factoryFn) {
            this.providerCache[name] = factoryFn;
        },
        service: function (name, Constructor) {
            this.factory(name, function () {
                var instance = Object.create(Constructor.prototype);
                this.invoke(Constructor, instance);
                return instance;
            }.bind(this));
        },
        getDependencies: function (arr) {
            var self = this;
            return arr.map(function (value) {
                return self.instanceCache[value];
            });
        },

        constant: function (name, dependency) {
            this.instanceCache[name] = dependency;
        }


    };
    module.exports = Injector;
});