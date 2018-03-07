/**
 * Created by marcogobbi on 02/04/2017.
 */
import getAllElements from "../src/core/display/get-all-elements";
var assert = require("chai").assert;

describe('getAllElements', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })

    it('it is a function', function () {

        assert.isFunction(getAllElements);
    });
    it('arity 1', function () {
        assert.lengthOf(getAllElements, 1);
    });
    it('ritorna un array', function () {
        document.body.innerHTML = '<div data-mediator="a"></div>';
        assert.isArray(getAllElements(document.body));
    });
    it("trova i nodi - solo figli", function () {
        document.body.innerHTML = '<div data-mediator="a"></div>';
        var nodes = [document.querySelector("[data-mediator]")];
        assert.sameDeepMembers(getAllElements(document.body), nodes,"non ci sono i nodi che mi aspetto che ci siano");
    });
    it("trova i nodi - il nodo ha un data-mediator associato", function () {
        document.body.innerHTML = '<div data-mediator="a"></div>';
        document.body.setAttribute("data-mediator","b");
        var nodes = [document.body,document.body.querySelector("[data-mediator]")];
        assert.sameDeepMembers(getAllElements(document.body), nodes,"non ci sono i nodi che mi aspetto che ci siano");
    })
});