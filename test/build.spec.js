/**
 * Created by mgobbi on 05/04/2017.
 */
import Build from "../src/core/display/build";
import flatten from "../src/internal/_flatten";
import getAllElements from "../src/core/display/get-all-elements";
var assert = require("chai").assert;

describe('build', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
    var mediators = [1, 2, 3, 4];

    function getMediators() {
        return mediators
    };
   // function getAllElements(a){return a;}
    function getMediatorsFromParams(args) {
        return flatten(args);
    };
    it('it is a function', function () {
        assert.isFunction(Build);
    });
    it('arity 2', function () {
        assert.lengthOf(Build, 2);
    });

    it('ritorna una funzione', function () {

        assert.isFunction(Build(getMediators,getAllElements), "non ritorna una funzione");

    });
    it('bootstrap: la funzione ritornata è di arity 1', function () {
        var bootstrap = Build(getMediators,getAllElements);
        assert.lengthOf(bootstrap, 1, "la funzione ritornata non ha arity 1");

    });
    it('bootstrap: ritorna il valore ritornato da getMediators', function () {
        var bootstrap = Build(getMediators,getAllElements);
        assert.equal(bootstrap(document.body), mediators, "non ritorna il valore di getMediators");
    });
    // it('bootstrap: ritorna il valore ritornato da getMediators', function () {
    //     var bootstrap = Build(getMediators);
    //     assert.equal(bootstrap(document.body), mediators, "non ritorna il valore di getMediators");
    // });
    it("bootstrap: se non trova data-mediator, ritorna un array vuoto", function () {
        var bootstrap = Build(getMediatorsFromParams,getAllElements);
        assert.lengthOf(bootstrap(document.body), 0, "non ritorna un array vuoto");
    });
    it("bootstrap: se  trova data-mediator, ritorna un array con i mediatori", function () {
        var divs = [];
        for (var i = 0; i < 4; i++) {
            var div = document.createElement("div");
            div.setAttribute("data-mediator", "module" + i);
            divs.push(div);
            document.body.appendChild(div);
        }//sameDeepMembers
        var bootstrap = Build(getMediatorsFromParams,getAllElements);
        assert.sameDeepMembers(bootstrap(document.body), divs, "non ritorna l' array di mediatori");
    })

});