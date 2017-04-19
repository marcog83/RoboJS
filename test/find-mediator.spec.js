/**
 * Created by marcogobbi on 02/04/2017.
 */
import FindMediator from "../src/core/display/find-mediator";
import curryN from "ramda/src/curryN";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('FindMediator', function () {
    var dispatcher = {};
    var disposable = {
        mediatorId: 1,
        node: "dom-element",
        dispose: _ => _
    };

    function Mediator(node, dispatcher) {
        return _ => _;
    }

    var getDefinition = curryN(2,function (a,b) {
        return "path/to/module"
    });
    var load = function (path) {
        return Promise.resolve({path,Mediator})
    };
    var create = curryN(3,function (node,dispatcher,Mediator) {
        return disposable;
    });
    var updateCache = function (disposable) {
        return disposable;
    };


    it('FindMediator is a function', function () {

        assert.isFunction(FindMediator);
    });
    it('arity 3', function () {
        assert.lengthOf(FindMediator, 3);
    });
    it('returns a function', function () {
        var findMediator = FindMediator(getDefinition, create, updateCache);

        assert.isFunction(findMediator);
    });
    it("trova il mediator", function (done) {
        var findMediator = FindMediator(getDefinition, create, updateCache);
        var node = {};
        findMediator(dispatcher, load, node).then(_disposable => {
            assert.equal(_disposable, disposable,"Non è fa correttamente la catena!!!");
            done();
        });

    })

});