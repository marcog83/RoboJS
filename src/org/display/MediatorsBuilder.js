/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var DisplayList = require("./DisplayList");
	var signals = require("../../../bower_components/signals/dist/signals.min");
	var CACHE = {};
	var Utils = {
		uid: [
			'0',
			'0',
			'0'
		],
		nextUid: function () {
			var index = Utils.uid.length;
			var digit;
			while (index) {
				index--;
				digit = Utils.uid[index].charCodeAt(0);
				if (digit == 57 /*'9'*/) {
					Utils.uid[index] = 'A';
					return Utils.uid.join('');
				}
				if (digit == 90  /*'Z'*/) {
					Utils.uid[index] = '0';
				} else {
					Utils.uid[index] = String.fromCharCode(digit + 1);
					return Utils.uid.join('');
				}
			}
			Utils.uid.unshift('0');
			return Utils.uid.join('');
		}
	};

	function MediatorsBuilder(_definition) {
		this.onAdded = new signals.Signal();
		this.onRemoved = new signals.Signal();
		this.definitions = _definition || [];
		this.displayList = new DisplayList();
		this.displayList.onAdded.add(this._handleNodesAdded, this);
		this.displayList.onRemoved.add(this._handleNodesRemoved, this);
	}

	MediatorsBuilder.prototype = {
		getMediators: function (target) {
			target = target || document;
			var promises = [];
			this.definitions.forEach(function (definition) {
				var nodes = this.findNodes(definition.id, target);
				if (nodes.length) {
					var promise = this._getMediator(definition, nodes);
					promises.push(promise);
				}
			}.bind(this));
			return Promise.all(promises).then(this._bootstrapMediators.bind(this));
		},
		_bootstrapMediators: function (mediators) {
			var _instances = [];
			mediators.forEach(function (def) {
				[].forEach.call(def.nodes, function (node) {
					var mediatorId = Utils.nextUid();
					node.dataset = node.dataset || {};
					node.dataset.mediatorId = mediatorId;
					var _mediator = new def.Mediator(node);
					_mediator.id = mediatorId;
					CACHE[mediatorId] = _mediator;
					_mediator.initialize();
					_instances.push(_mediator);
				});
			});
			return _instances;
		},
		findNodes: function (id, target) {
			var _found = [];
			if (target.dataset && target.dataset.mediator == id) {
				_found = [target];
			} else {
				_found = target.querySelectorAll("[data-mediator=" + id + "]");
			}
			return _found;
		},
		_getMediator: function (definition, nodes) {
			return new Promise(function (resolve, reject) {
				require([definition.mediator], function (Mediator) {
					resolve({
						Mediator: Mediator,
						nodes: nodes
					});
				});
			});
		},
		_handleNodesAdded: function (nodes) {
			[].forEach.call(nodes, function (node) {
				this.getMediators(node).then(function (mediators) {
					if (mediators.length) {
						this.onAdded.dispatch(mediators);
					}
				}.bind(this));
			}.bind(this));
		},
		_handleNodesRemoved: function (nodes) {
			[].forEach.call(nodes, function (node) {
				if (node.dataset && node.dataset.mediator) {
					this._destroyMediator(node);
				} else {
					[].forEach.call(node.querySelectorAll("[data-mediator]"), this._destroyMediator.bind(this));
				}
			}.bind(this));
		},
		_destroyMediator: function (node) {
			var mediatorId = node.dataset && node.dataset.mediatorId;
			var mediator = CACHE[mediatorId];
			if (mediator) {
				mediator.destroy && mediator.destroy();
				mediator.postDestroy && mediator.postDestroy();
				mediator.element && (mediator.element = null);
			}
			this.onRemoved.dispatch(mediator);
			CACHE[mediatorId] = null;
			mediator = null;
		}
	};
	module.exports = MediatorsBuilder;
});