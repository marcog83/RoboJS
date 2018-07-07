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
    it('Loader is a instanceof Loader', function () {
        assert.instanceOf(new Loader(), Loader);
    });


    it('L\'oggetto ritornato ha 1 metodo load', function () {
        var loader = new CustomLoader(_ => _);

        assert.instanceOf(loader.load(""), Promise, "load non è un Promise");

        assert.isFunction(loader.load, "load non è una funzione");

    });
    it('AMDLoader is a instanceof Loader', function () {
        const loader = new AMDLoader();

        assert.instanceOf(loader, Loader);


    });
    it('AMDLoader use require correctly', function (done) {
        const loader = new AMDLoader();
        const id = "my-id";
        window.require = (id, resolve, reject) => {
            assert.equal(id[0], id, "id non coincide");
            assert.isFunction(resolve, "resolve non è una funzione");
            assert.isFunction(reject, "reject non è una funzione");
            done();
        };

        loader.load(id)

    });
    it('CustomLoader is a instanceof Loader', function (done) {
        const myid = "my-id";
        const fn = (id, resolve, reject) => {

            assert.equal(id, myid, "id non coincide");
            assert.isFunction(resolve, "resolve non è una funzione");
            assert.isFunction(reject, "reject non è una funzione");
            done();
        };
        const loader = new CustomLoader(fn);

        assert.instanceOf(loader, Loader);
        assert.equal(loader.fn, fn);
        loader.load(myid);

    });
});