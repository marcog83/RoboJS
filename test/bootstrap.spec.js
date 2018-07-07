/**
 * Created by mgobbi on 05/04/2017.
 */
import {bootstrap} from "../src/index";
import {Loader} from "../src/net/Loader";
import {Robo} from "../src/display/Robo";


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

    it('ritorna una istanza di Robo', function () {

        assert.instanceOf(bootstrap({definitions: {}}), Robo, "non ritorna una istanza di Robo");

    });
    it('Si può passare il loader', function () {
        const loader = new Loader();
        const robo = bootstrap({definitions: {}, loader});
        assert.equal(robo.loader, loader, "non ritorna un Oggetto");

    });
    it('Si può passare la root', function () {
        const root = document.createElement("div");
        const robo = bootstrap({definitions: {}, root });
        assert.equal(robo.root,root, "non ritorna un Oggetto");

    });

    it('bootstrap: dispose viene chiamata ', function () {
        const robo = bootstrap({definitions: {} });
        robo.dispose();

        assert.ok("dispose non da errori");

    });

});