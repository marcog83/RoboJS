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
        node.innerHTML = "<div data-mediator='a'><p data-mediator='c'></p><p data-mediator='b'></p></div>";
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
       /* handler.findMediators(load, node).then(newCache => {
            assert.equal(newCache.length, 1);
            done();
        })*/
    });
    it("destroy", function () {
    });
    it("findMediator", function (done) {

        handler.findMediator(load, node).then(newCache => {
            assert.equal(newCache.length, 1);
            done();
        })
    });
    it("hasMediator", function () {
    });

});