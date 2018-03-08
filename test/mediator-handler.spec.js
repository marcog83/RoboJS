/**
 * Created by marcogobbi on 02/04/2017.
 */
import MediatorHandler from "../src/core/display/mediator-handler";
var assert = require("chai").assert;

describe('MediatorHandler', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
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
        document.body.appendChild(node);
        handler = MediatorHandler({definitions});
    });

    it('it is a function', function () {

        assert.isFunction(MediatorHandler);
    });
    it('arity 1', function () {
        assert.lengthOf(MediatorHandler, 1);
    });
    /*
     dispose,
     destroy,
     findMediators:_findMediators(dispatcher)
     hasMediator,
     getAllElements --> già testata
     */


    it("dispose", function (done) {

        handler.findMediator(load, node).then(newCache => {
            assert.lengthOf(newCache, 1,"non ha inserito correttamente in cache");
            handler.dispose();
            assert.ok("non so come testarlo!");
            done();
        }).catch(done)

    });
    it("destroy: destroy one element and update cache array", function (done) {
        var newDIV = document.createElement("div");
        newDIV.setAttribute("data-mediator", "b");
        Promise.all([
            handler.findMediator(load, node)
            , handler.findMediator(load, newDIV)
        ]).then(newCache => {
            var emptyCache = handler.destroy(node);
            assert.lengthOf(emptyCache, 1, "non ha eliminato correttamente l'elemento e la cache non è quella che mi aspettavo");
            assert.equal(emptyCache[0].node, newDIV, "non è il nodo che mi aspettavo rimanesse");

            done();
        }).catch(done)
    });
    it("findMediator", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.lengthOf(newCache, 1,"non ha inserito correttamente in cache");
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
       assert.isTrue(handler.hasMediator(node));
    });
    it("hasMediator,il nodo deve avere una definizione", function (done) {
        var newDIV = document.createElement("div");
        newDIV.setAttribute("data-mediator", "non-esiste");
        handler.findMediator(load, newDIV).then(newCache => {
            assert.isFalse(handler.hasMediator(newDIV));
            done();
        }).catch(done);
    });
    it("hasMediator non deve essere presente in cache", function (done) {
        handler.findMediator(load, node).then(newCache => {
            assert.isFalse(handler.hasMediator(node));
            done();
        }).catch(done);
    });
    it("crea un oggetto vuoto per definitions, crea new EventTarget se non specificato", function (done) {
        //makeDispatcher()
        var handler = MediatorHandler();
        handler.findMediator(load, node).then(newCache => {
            assert.isFalse(handler.hasMediator(node));
            done();
        }).catch(done);
    });
});