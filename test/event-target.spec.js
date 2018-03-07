/**
 * Created by mgobbi on 05/04/2017.
 */

import {makeDispatcher} from "../src/core/events/event-dispatcher";
//import dispatcher from "../src/core/events/event-dispatcher";
var assert = require("chai").assert;


describe('EventTarget', function () {

    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
    var Event, CustomEvent, dispatcher;
    beforeEach(function () {
        Event = window.Event;
        CustomEvent = window.CustomEvent;
        dispatcher = makeDispatcher();
    })
    it('makeDispatcher: it is a function', function () {

        assert.isFunction(makeDispatcher);
    });
    it('dispatcher: it is a object', function () {

        assert.isObject(dispatcher);
    });

    it('ritorna un oggetto con le funzioni esposte', function () {


        assert.isFunction(dispatcher.addEventListener);
        assert.isFunction(dispatcher.removeEventListener);
        assert.isFunction(dispatcher.dispatchEvent);

    });
    it('dispatchEvent dispaccia correttamente a 1 listener', function () {
        var params = [12345, 'text', {a: 1}];


        dispatcher.addEventListener("a", _ => assert.ok("ok"));
        dispatcher.dispatchEvent(new Event("a"));
        dispatcher.addEventListener("b", e => assert.equal(e.detail, params, "ok"));
        dispatcher.dispatchEvent(new CustomEvent("b", {detail: params}));

    });

    it('dispatcher dispaccia correttamente a più listeners', function () {
        var params = [12345, 'text', {a: 2}];


        dispatcher.addEventListener("b", e => {
            var a=0;
            assert.equal(e.detail, params)
        });
        dispatcher.addEventListener("b", e => {
            var a=1;
            assert.equal(e.detail, params)
        });
        dispatcher.addEventListener("b", e =>{
            var a=2;
            assert.equal(e.detail, params)
        } );
        dispatcher.addEventListener("b", e => assert.equal(e.detail, params));
        dispatcher.dispatchEvent(new CustomEvent("b", {detail: params}));
    });
    it('dispatcher connette lo stesso listener solo una volta', function () {

        let i = 0;
        const listener = e => i = i + 1;
        dispatcher.addEventListener("b", listener);
        dispatcher.addEventListener("b", listener);
        dispatcher.addEventListener("b", listener);
        dispatcher.addEventListener("b", listener);
        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 1, "");
    });

    it('removeEventListener rimuove correttamente il listener', function () {

        let i = 0;
        const listener = e => i = i + 1;
        dispatcher.addEventListener("b", listener);
        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 0, "");
    });
    it('removeEventListener senza listeners', function () {

        let i = 0;
        const listener = e => i = i + 1;

        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 0, "");
    });
    it('removeEventListener con più listeners', function () {

        let i = 0;
        const listener = e => i = i + 1;

        dispatcher.addEventListener("b", listener);
        dispatcher.addEventListener("b", _=>3);
        dispatcher.addEventListener("b", _=>_);
        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 0, "");
    });
});