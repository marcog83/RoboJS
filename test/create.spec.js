/**
 * Created by marcogobbi on 02/04/2017.
 */
import create from "../src/core/display/create";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('inCache', function () {
    jsdom();


    it('it is a function', function () {

        assert.isFunction(create);
    });
    it('arity 3', function () {
        assert.equal(create.length, 3);
    });
    it('ritorna true se tova il mediator', function () {
        var div = document.createElement("div");
        var MEDIATOR_CACHE = [{
            node: div
            , dispose: _ => _
            , mediatorId: 1
        }];
        assert.equal(inCache(MEDIATOR_CACHE, div),true);
    });
    it('ritorna false se non tova il mediator', function () {
        var div = document.createElement("div");
        var node = document.createElement("div");
        var MEDIATOR_CACHE = [{
            node: div
            , dispose: _ => _
            , mediatorId: 1
        }];
        assert.equal(inCache(MEDIATOR_CACHE, node),false);
    });
});