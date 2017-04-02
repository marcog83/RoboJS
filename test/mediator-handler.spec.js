/**
 * Created by marcogobbi on 02/04/2017.
 */
import MediatorHandler from "../src/core/display/mediator-handler";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('MediatorHandler', function () {
    var handler;
    beforeEach(function () {
        // runs before each test in this block
        var definitions = {};
        handler = MediatorHandler({definitions});
    });

    it('it is a function', function () {

        assert.isFunction(MediatorHandler);
    });
    it('arity 1', function () {
        assert.equal(MediatorHandler.length, 1);
    });

});