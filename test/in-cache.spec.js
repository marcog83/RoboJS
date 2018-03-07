/**
 * Created by mgobbi on 31/03/2017.
 */
import inCache from "../src/core/display/in-cache";
var assert = require("chai").assert;

describe('inCache', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })


    it('it is a function', function () {

        assert.isFunction(inCache);
    });
    it('arity 2', function () {
        assert.lengthOf(inCache, 2);
    });
    it('ritorna true se tova il mediator', function () {
        var div = document.createElement("div");
        var MEDIATOR_CACHE = [{
            node: div
            , dispose: _ => _
            , mediatorId: 1
        }];
        assert.isTrue(inCache(MEDIATOR_CACHE, div));
    });
    it('ritorna false se non tova il mediator', function () {
        var div = document.createElement("div");
        var node = document.createElement("div");
        var MEDIATOR_CACHE = [{
            node: div
            , dispose: _ => _
            , mediatorId: 1
        }];
        assert.isFalse(inCache(MEDIATOR_CACHE, node));
    });
});