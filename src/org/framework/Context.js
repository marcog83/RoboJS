define([], function () {
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
			// configure extensions and configs;
			this.extensions.forEach(this._extendAll.bind(this));
			this.configs.forEach(this._configureAll.bind(this));
			// initialize extensions and configs;
			this.extensions.forEach(this._initExtension.bind(this));
			this.configs.forEach(this._initConfig.bind(this));
		},
		_extendAll: function (extension) {
			this._extensionCache[extension] = this._extensionCache[extension] || extension;
			var ext = this._extensionCache[extension];
			ext.extend(this);
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