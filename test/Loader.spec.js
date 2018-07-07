/**
 * Created by mgobbi on 05/04/2017.
 */
import {Loader, AMDLoader, CustomLoader} from "../src/net/Loader";


var assert = require("chai").assert;

describe('Loader', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })

    beforeEach(() => {

    })
    it('it is a instanceof Loader', function () {
        assert.instanceOf(new Loader(),Loader);
    });


    it('L\'oggetto ritornato ha 1 metodo load', function () {
        var loader = new CustomLoader(_ => _);

        assert.instanceOf(loader.load(""), Promise, "load non è un Promise");

        assert.isFunction(loader.load, "load non è una funzione");

    });
    it('AMDLoader function', function () {

        window.require = (id, resolve, reject) => {
            assert.equal(id[0], "my-id", "AMDLoader non è una funzione");
            assert.isFunction(resolve, "resolve non è una funzione");
            assert.isFunction(reject, "reject non è una funzione");
        };
        assert.isFunction(AMDLoader, "AMDLoader non è una funzione");
        new AMDLoader();

    });
    it('AMDLoader arity 3', function () {


        assert.lengthOf(AMDLoader, 3);
    });

});