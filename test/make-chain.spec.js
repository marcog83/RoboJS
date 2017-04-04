/**
 * Created by mgobbi on 04/04/2017.
 */
import makeChain from "../src/core/display/make-chain";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('make chain', function () {
    jsdom();
    function emit(args) {
        return args;
    }

    it('it is a function', function () {
        assert.isFunction(makeChain);
    });
    it('arity 2', function () {
        assert.equal(makeChain.length, 2);
    });
    it('ritorna una funzione', function () {
        var _makeChain = makeChain("addedNodes", _ => _);

        assert.isFunction(_makeChain);
    });

    it('I nodi aggiunti senza data-mediator non vengono considerati', function () {
        let getAdded = makeChain("addedNodes", emit);
        var mutations = [{
            addedNodes: [document.createElement("div"), document.createElement("p"), document.createElement("nav")]
        }];
        assert.equal(getAdded(mutations).length, 0, "non dovrebbe trovare nulla");
    });
    it('ritorna i nodi aggiunti che hanno il data-mediator', function () {
        let getAdded = makeChain("addedNodes", emit);
        var p = document.createElement("p");
        p.setAttribute("data-mediator", "a");
        var mutations = [{
            addedNodes: [document.createElement("div"), p, document.createElement("nav")]
        }];
        assert.deepEqual(getAdded(mutations)[0], [p], "dovrebbe trovare solo il p");
    });
    it('I nodi rimossi senza data-mediator non vengono considerati', function () {
        let getRemoved = makeChain("removedNodes", emit);
        var mutations = [{
            removedNodes: [document.createElement("div"), document.createElement("p"), document.createElement("nav")]
        }];
        assert.equal(getRemoved(mutations).length, 0, "non dovrebbe trovare nulla");
    });
    it('ritorna soli i nodi rimossi che hanno il data-mediator', function () {
        let getRemoved = makeChain("removedNodes", emit);
        var p = document.createElement("p");
        p.setAttribute("data-mediator", "a");
        var mutations = [{
            removedNodes: [document.createElement("div"), p, document.createElement("nav")]
        }];
        assert.deepEqual(getRemoved(mutations)[0], [p], "dovrebbe trovare solo il p");
    });
});