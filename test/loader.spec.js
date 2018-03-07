/**
 * Created by mgobbi on 05/04/2017.
 */
import Loader from "../src/core/net/loader";
import AMDLoader from "../src/core/net/amd-loader";


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
    it('it is a function', function () {
        assert.isFunction(Loader);
    });

    it('ritorna un Oggetto', function () {

        assert.isObject(Loader(), "non ritorna un Oggetto");

    });
    it('L\'oggetto ritornato ha 1 metodo load', function () {
        var {load} = Loader(_ => _);

        assert.instanceOf(load(""), Promise, "load non è un Promise");

        assert.isFunction(load, "load non è una funzione");

    });
    it('AMDLoader function', function () {

        window.require = (id,resolve,reject) => {
            assert.equal(id[0],"my-id", "AMDLoader non è una funzione");
            assert.isFunction(resolve, "resolve non è una funzione");
            assert.isFunction(reject, "reject non è una funzione");
        };
        assert.isFunction(AMDLoader, "AMDLoader non è una funzione");
        AMDLoader("my-id",_=>_,_=>_);

    });
    it('AMDLoader arity 3', function () {


        assert.lengthOf(AMDLoader, 3);
    });

});