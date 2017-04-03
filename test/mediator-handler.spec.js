/**
 * Created by marcogobbi on 02/04/2017.
 */
import MediatorHandler from "../src/core/display/mediator-handler";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('MediatorHandler', function () {
    jsdom();
    var handler;
    var load, node, definitions;

    function disposeFn() {

    };
    function Mediator(node, dispatcher) {
        return disposeFn;
    }

    beforeEach(function () {
        // runs before each test in this block
        definitions = {
            a: "path/to/a"
            , b: "path/to/b"
            , c: "path/to/c"
        };
        load = function (url) {
            return Promise.resolve(Mediator);
        };
        node = document.createElement("div");
        node.setAttribute("data-mediator","a") ;
        handler = MediatorHandler({definitions});
    });

    it('it is a function', function () {

        assert.isFunction(MediatorHandler);
    });
    it('arity 1', function () {
        assert.equal(MediatorHandler.length, 1);
    });
    /*
     dispose,
     destroy,
     findMediators:_findMediators(dispatcher)
     hasMediator,
     getAllElements --> già testata
     */


    it("dispose", function () {
        assert.isOk("non so come testarlo!");
    });
    it("destroy: destroy one element and update cache array", function (done) {
        var newDIV = document.createElement("div");
        newDIV.setAttribute("data-mediator", "b");
        Promise.all([
            handler.findMediator(load, node)
            , handler.findMediator(load, newDIV)
        ]).then(newCache => {
            var emptyCache = handler.destroy(node);
            assert.equal(emptyCache.length, 1, "non ha eliminato correttamente l'elemento e la cache non è quella che mi aspettavo");
            assert.equal(emptyCache[0].node, newDIV, "non è il nodo che mi aspettavo rimanesse");

            done();
        }).catch(done)
    });
    it("findMediator", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.equal(newCache.length, 1,"non ha inserito correttamente in cache");
            done();
        }).catch(done)
    });
    it("findMediator : cache contiene il corretto node", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.equal(newCache[0].node, node,"non ha inserito correttamente in cache");
            done();
        }).catch(done)
    });
    it("findMediator : cache contiene il corretto dispose", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.equal(newCache[0].dispose, disposeFn,"non ha inserito correttamente in cache");
            done();
        }).catch(done)
    });
    it("hasMediator, il nodo deve avere una definizione e non deve essere in cache", function () {
       assert.equal(handler.hasMediator(node),true);
    });
    it("hasMediator,il nodo deve avere una definizione", function (done) {
        var newDIV = document.createElement("div");
        newDIV.setAttribute("data-mediator", "non-esiste");
        handler.findMediator(load, newDIV).then(newCache => {
            assert.equal(handler.hasMediator(newDIV),false);
            done();
        }).catch(done);
    });
    it("hasMediator non deve essere presente in cache", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.equal(handler.hasMediator(node),false);
            done();
        }).catch(done);
    });

});