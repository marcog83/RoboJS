/**
 * Created by mgobbi on 05/04/2017.
 */

import {Robo} from "../src/display/Robo";
import {MediatorHandler} from "../src/display/MediatorHandler";
import {AMDLoader, CustomLoader} from "../src/net/Loader";
import {DomWatcher} from "../src/display/DomWatcher";
import {Disposable} from "../src/display/Disposable";
import _noop from "../src/internal/_noop";


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
        document.body.innerHTML="";
        definitions = {
            "a": _ => {
            }, "b": _ => {
            }
        };
        robo = new Robo({definitions});
    });

    it('robo.definitions are definitions', function () {
        const definitions2 = {"a": 1, "b": 2};
        const robo = new Robo({definitions: definitions2});
        assert.equal(robo.definitions, definitions2);
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
    it('robo.getMediators returns promise of mediators', function (done) {

        window.require = (id, resolve, reject) => {

            resolve(id[0]);
        };
        const div1 = document.createElement("div");

        const div2 = document.createElement("div");
        const div3 = document.createElement("div");
        div1.setAttribute("data-mediator", "a");
        div2.setAttribute("data-mediator", "b");
        document.body.appendChild(div1);
        document.body.appendChild(div2);
        document.body.appendChild(div3);

        robo.getMediators(document.body.querySelectorAll("*")).then(([a, b]) => {

            assert.instanceOf(a, Disposable);
            assert.instanceOf(b, Disposable);
            assert.equal(a.node, div1);
            assert.equal(b.node, div2);
            assert.equal(a.mediatorId, div1.getAttribute("mediatorid"));
            assert.equal(b.mediatorId, div2.getAttribute("mediatorid"));
            assert.equal(a.dispose, _noop);
            assert.equal(b.dispose, _noop);
            done();
        }).catch(_ => {
            console.error(_);
            assert.fail(_);
            done();
        })
    });
    it('robo.removeMediators removes mediators and update cache', function (done) {

        window.require = (id, resolve, reject) => {

            resolve(id[0]);
        };
        const div1 = document.createElement("div");

        const div2 = document.createElement("div");
        const div3 = document.createElement("div");
        div1.setAttribute("data-mediator", "a");
        div2.setAttribute("data-mediator", "b");

        document.body.appendChild(div1);
        document.body.appendChild(div2);
        document.body.appendChild(div3);

        robo.getMediators(document.body.querySelectorAll("*"))
            .then(_ => {
                robo.removeMediators([div1]);

                assert.lengthOf(robo.handler.MEDIATORS_CACHE, 1);
                robo.removeMediators([div3]);

                assert.lengthOf(robo.handler.MEDIATORS_CACHE, 1);
                robo.removeMediators(Array.from(document.body.querySelectorAll("*")));
                assert.lengthOf(robo.handler.MEDIATORS_CACHE, 0);

                done();
            }).catch(_ => {
            console.error(_);
            assert.fail(_);
            done();
        })
    });
});