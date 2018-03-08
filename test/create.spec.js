/**
 * Created by marcogobbi on 02/04/2017.
 */
import create from "../src/core/display/create";
import {noop} from "../src/internal/index";
var assert = require("chai").assert;

describe('create', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
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
        document.body.appendChild(node);
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
    it("il disposable ha una funzione di dispose noop se Mediator non ritorna una funzione", function () {
        var node = document.createElement("div");
        document.body.appendChild(node);
        function  FakeMediator(_node){
             assert.equal(_node,node,"il nodo del mediator non è lo stesso di quello passato")
        }
        disposable = create(node, dispatcher, FakeMediator);
        assert.equal(disposable.dispose, noop, "la funzione di dispose non è ritornata correttamente");

    });
    it('il node del disposable è lo stesso passato al Mediator', function () {

        assert.equal(disposable.node, node, "il nodo del dom non è corretto");
    });
    it("Un node senza parentNode, ritorna un disposable speciale", function () {
        var floatNode = document.createElement("div");
         function  FakeMediator(node){
             assert.fail("il mediator non deve essere chiamato, se il nodo non è attaccato al DOM")
             return function(){
                 assert.fail("il disposable non deve essere chiamato, se il nodo non è attaccato al DOM")

             }
         }
        disposable = create(floatNode, dispatcher, FakeMediator);
        assert.equal(disposable.dispose, noop, "la funzione di dispose non è ritornata correttamente");
        assert.equal(disposable.node, floatNode, "il nodo non è quello giusto");
        assert.equal(disposable.mediatorId, floatNode.getAttribute("mediatorId"), "il mediatorId non è quello giusto");

    });
});