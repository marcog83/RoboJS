define(["../display/MediatorsBuilder"], function (MediatorsBuilder) {
    'use strict';
    function Context() {

        this.setup();
    }

    Context.prototype = {
        setup: function () {
            this.injector = new Injector();
            this.injector.map('Injector').toValue(this.injector);
            this.injector.map('Context').toValue(this);
            this.extensions = [];
            this._extensionCache = [];
            this._configCache = [];

            this.configs = [];

        },
        install: function () {
            this.extensions = this.extensions.concat(Array.prototype.slice.call(arguments, 0));
            return this;
        },
        configure: function (type, name) {
            this.configs.push({
                type: type,
                name: name
            });
            return this;
            //
        },
        initialize: function () {
            this.extensions.forEach(this._initExtensions.bind(this));
            this.configs.forEach(this._initConfig.bind(this));
        },
        _initExtensions: function (extension) {
            this._extensionCache[extension] = this._extensionCache[extension] || extension;
            var ext = this._extensionCache[extension];
            ext.extend(this);
        },
        _initConfig: function (config) {
            this._configCache[config.name] = this._configCache[config.name]
            || this.injector.getOrCreateNewInstance(config.type, config.name);
            this._configCache[config.name].configure();
        }
    };
    return Context;
});