/**
 * Created by mgobbi on 31/03/2017.
 */
import inCache from "../src/core/display/in-cache";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('inCache', function () {
    jsdom();


    it('it is a function', function () {

        assert.isFunction(inCache);
    });
    it('arity 2', function () {
        assert.equal(inCache.length, 2);
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