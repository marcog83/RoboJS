/**
 * Created by marcogobbi on 02/04/2017.
 */
import create from "../src/core/display/create";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('create', function () {
    jsdom();
    var node;
    var dispatcher = {};
    var disposable;
    function disposeFn() {
    }

    function Mediator(node, dispatcher) {
        return disposeFn
    }

    beforeEach(function () {
        node = document.createElement("div");
        disposable = create(node, dispatcher, Mediator);
    });
    it('it is a function', function () {
        assert.isFunction(create);
    });
    it('arity 3', function () {
        assert.lengthOf(create, 3);
    });

    it('ritorna un oggetto con il mediatorId', function () {

        assert.isDefined(disposable.mediatorId, "mediator id defined");

    });
    it("setta l'attributo mediatorid nel nodo DOM", function () {


        assert.isDefined(node.getAttribute("mediatorid"), "l'attributo mediatorid non è stato aggiunto al nodo");

    });
    it("l'attributo mediatorid è uguale alla proprietà del disposable", function () {


        assert.equal(node.getAttribute("mediatorid"), disposable.mediatorId, "l'attributo mediatorid non è lo stesso di quello generato");

    });
    it("il disposable ha una funzione di dispose ritornata da Mediator", function () {

        assert.equal(disposable.dispose, disposeFn, "la funzione di dispose non è ritornata correttamente");

    });
    it('il node del disposable è lo stesso passato al Mediator', function () {

        assert.equal(disposable.node, node, "il nodo del dom non è corretto");
    });

});