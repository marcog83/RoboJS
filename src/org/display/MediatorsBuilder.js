/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require, exports, module) {
	"use strict";
	var DisplayList = require("./DisplayList");
	var ScriptLoader = require("../net/ScriptLoader");
	var signals = require("../../../bower_components/signals/dist/signals.min");
	var _ = require("../../../bower_components/lodash/dist/lodash.min");
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
			target = target || document.body;
			// find every children and transform from NodeList to Array
			var nodes = [].slice.call(target.getElementsByTagName("*"), 0);
			// add the target as first
			nodes.unshift(target);
			// find the promises for each Mediator
			// for each node it increase the result Array (3^ parameter) and return it to promises.
			var promises = _.reduce(nodes, this._findMediators.bind(this), []);
			return Promise.all(promises);
		},
		_findMediators: function (result, node, index) {
			// prefill _initMediator with node parameter
			var _partialInit = _.partial(this._initMediator, node);
			// filter definitions based on actual Node

			// once you get the Mediators you need, load the specific script.
			var mediators = _.chain(this.definitions)
				.filter(function (def) {
					return node.dataset && node.dataset.mediator == def.id;
				})
				.map(function (def) {
					return ScriptLoader.require(def.mediator).then(_partialInit);
				}).value();
			// add mediators promise to the result Array
			return result.concat(mediators);
		},
		_initMediator: function (node, Mediator) {
			var mediatorId = Utils.nextUid();
			node.dataset = node.dataset || {};
			node.dataset.mediatorId = mediatorId;
			var _mediator = new Mediator(node);
			_mediator.id = mediatorId;
			CACHE[mediatorId] = _mediator;
			_mediator.initialize();
			return _mediator;
		},
		_handleNodesAdded: function (nodes) {
			_.forEach(nodes, function (node) {
				this.getMediators(node).then(function (mediators) {
					if (mediators.length) {
						this.onAdded.dispatch(mediators);
					}
				}.bind(this));
			}.bind(this));
		},
		_handleNodesRemoved: function (nodes) {
			_.chain(nodes)
				.reduce(this._reduceNodesRemoved, [])
				.forEach(this._destroyMediator.bind(this))
		},
		_reduceNodesRemoved: function (result, node) {
			var n = [].slice.call(node.getElementsByTagName("*"), 0);
			n.unshift(node);
			return result.concat(n);
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