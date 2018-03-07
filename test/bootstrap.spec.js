/**
 * Created by mgobbi on 05/04/2017.
 */
import bootstrap from "../src/core/display/bootstrap";


var assert = require("chai").assert;

require('./libs/MutationObserver');



describe('bootstrap', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })


    it('it is a function', function () {
        assert.isFunction(bootstrap);
    });
    it('arity 1', function () {
        assert.lengthOf(bootstrap, 1);
    });

    it('ritorna un Oggetto', function () {

        assert.isObject(bootstrap({definitions: {}}), "non ritorna un Oggetto");

    });
    it('bootstrap: L\'oggetto ritornato ha due proprietà, promise e dispose', function () {
        let {promise,dispose} = bootstrap({definitions: {}});

        assert.instanceOf(promise, Promise, "promise non è una promessa");
        assert.isFunction(dispose, "dispose non è una funzione");

    });
    it('bootstrap: dispose viene chiamata ', function () {
        let {dispose} = bootstrap({definitions: {}});
        dispose();

        assert.ok( "dispose non da errori");

    });

});