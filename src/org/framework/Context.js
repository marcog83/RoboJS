define(["jss"], function (jss) {
    'use strict';
    function Context() {
        this.setup();
    }

    Context.prototype = {
        setup: function () {
            this.injector = new jss.Injector();
            this.injector.map('Injector').toValue(this.injector);
            this.injector.map('Context').toValue(this);
            this.extensions = [];

            this._configCache = [];
            this.configs = [];
        },
        install: function () {
            var extensions = Array.prototype.slice.call(arguments, 0);
            extensions.forEach(this._extendAll.bind(this));
            this.extensions = this.extensions.concat(extensions);

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
            // configure extensions and configs;

            this.configs.forEach(this._configureAll.bind(this));
            // initialize extensions and configs;
            this.extensions.forEach(this._initExtension.bind(this));
            this.configs.forEach(this._initConfig.bind(this));
        },
        _extendAll: function (extension) {
            extension.extend(this);
        },
        _configureAll: function (config) {
            var conf = this._configCache[config.name] = this._configCache[config.name] || this.injector.getOrCreateNewInstance(config.type, config.name);
            conf.configure();
            return conf;
        },
        _initConfig: function (conf) {
            conf.initialize && conf.initialize();
        },
        _initExtension: function (extension) {
            extension.initialize && extension.initialize();
        }
    };
    return Context;
});