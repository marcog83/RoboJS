/**
 * Created by marcogobbi on 02/04/2017.
 */
import FindMediators from "../src/core/display/find-mediators";
import curryN from "ramda/src/curryN";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('FindMediators', function () {
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


    it('FindMediators is a function', function () {

        assert.isFunction(FindMediators);
    });
    it('arity 3', function () {
        assert.equal(FindMediators.length, 3);
    });
    it('returns a function', function () {
        var findMediators = FindMediators(getDefinition, create, updateCache);

        assert.isFunction(findMediators);
    });
    it("trova i mediators", function (done) {
        var findMediators = FindMediators(getDefinition, create, updateCache);
        var node = {};
        findMediators(dispatcher, load, node).then(_disposable => {
            assert.equal(_disposable, disposable,"Non è fa correttamente la catena!!!");
            done();
        });

    })

});