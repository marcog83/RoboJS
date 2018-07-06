/**
 * Created by mgobbi on 05/04/2017.
 */

import {Robo} from "../src/display/Robo";
import {MediatorHandler} from "../src/display/MediatorHandler";
import {AMDLoader} from "../src/net/Loader";


var assert = require("chai").assert;

require('./libs/MutationObserver');


describe('Robo', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    });
    let definitions;
    let robo;
    after(function () {
        this.jsdom()
    });
    beforeEach(function () {
        definitions = {"a": 1, "b": 2};
        robo = new Robo({definitions});
    });

    it('robo.definitions are definitions', function () {

        assert.equal(robo.definitions, definitions);
    });
    it('default root is body', function () {

        assert.equal(robo.root, document.body);
    });
    it('default loader is an AMDLoader', function () {

        assert.instanceOf(robo.loader, AMDLoader);
    });
    it('default loader is an MediatorHandler', function () {

        assert.instanceOf(robo.handler, MediatorHandler);
    });
    it('default watcher is a DomWatcher', function () {

        assert.instanceOf(robo.watcher, DomWatcher);
    });
});