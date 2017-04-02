/**
 * Created by marcogobbi on 02/04/2017.
 */
import getAllElements from "../src/core/display/get-all-elements";
var assert = require("chai").assert;
var jsdom = require('mocha-jsdom');

describe('getAllElements', function () {
    jsdom();


    it('it is a function', function () {

        assert.isFunction(getAllElements);
    });
    it('arity 1', function () {
        assert.equal(getAllElements.length, 1);
    });
    it('ritorna un array', function () {
        document.body.innerHTML = '<div data-mediator="a"></div>';
        assert.isArray(getAllElements(document.body));
    });
    it("trova i nodi", function () {
        document.body.innerHTML = '<div data-mediator="a"></div>';
        var nodes = [document.body, document.querySelector("[data-mediator]")];
        assert.deepEqual(getAllElements(document.body), nodes);
    })
});