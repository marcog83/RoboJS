/**
 * Created by mgobbi on 04/04/2017.
 */
import makeChain from "../src/core/display/make-chain";
import getAllElements from "../src/core/display/get-all-elements";
var assert = require("chai").assert;

describe('make chain', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
    function emit(args) {
        return args;
    }

    it('it is a function', function () {
        assert.isFunction(makeChain);
    });
    it('arity 3', function () {
        assert.lengthOf(makeChain, 3);
    });
    it('ritorna una funzione', function () {
        var _makeChain = makeChain("addedNodes",getAllElements, _ => _);

        assert.isFunction(_makeChain);
    });

    it('I nodi aggiunti senza data-mediator non vengono considerati', function () {
        let getAdded = makeChain("addedNodes",getAllElements, emit);
        var mutations = [{
            addedNodes: [document.createElement("div"), document.createElement("p"), document.createElement("nav")]
        }];
        assert.lengthOf(getAdded(mutations), 0, "non dovrebbe trovare nulla");
    });
    it('ritorna i nodi aggiunti che hanno il data-mediator', function () {
        let getAdded = makeChain("addedNodes",getAllElements, emit);
        var p = document.createElement("p");
        p.setAttribute("data-mediator", "a");
        var mutations = [{
            addedNodes: [document.createElement("div"), p, document.createElement("nav")]
        }];
        assert.strictEqual(getAdded(mutations)[0], p, "dovrebbe trovare solo il p");
    });
    it('I nodi rimossi senza data-mediator non vengono considerati', function () {
        let getRemoved = makeChain("removedNodes",getAllElements, emit);
        var mutations = [{
            removedNodes: [document.createElement("div"), document.createElement("p"), document.createElement("nav")]
        }];
        assert.lengthOf(getRemoved(mutations), 0, "non dovrebbe trovare nulla");
    });
    it('ritorna soli i nodi rimossi che hanno il data-mediator', function () {
        let getRemoved = makeChain("removedNodes",getAllElements, emit);
        var p = document.createElement("p");
        p.setAttribute("data-mediator", "a");
        var mutations = [{
            removedNodes: [document.createElement("div"), p, document.createElement("nav")]
        }];
        assert.strictEqual(getRemoved(mutations)[0], p, "dovrebbe trovare solo il p");
    });
});