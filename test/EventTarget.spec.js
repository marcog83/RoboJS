/**
 * Created by mgobbi on 05/04/2017.
 */

import {EventDispatcher} from "../src/events/EventTarget";

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
        dispatcher = new EventDispatcher();
    })

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
            var a = 0;
            assert.equal(e.detail, params)
        });
        dispatcher.addEventListener("b", e => {
            var a = 1;
            assert.equal(e.detail, params)
        });
        dispatcher.addEventListener("b", e => {
            var a = 2;
            assert.equal(e.detail, params)
        });
        dispatcher.addEventListener("b", e => assert.equal(e.detail, params));
        dispatcher.dispatchEvent(new CustomEvent("b", {detail: params}));
    });
    it('dispatcher preventdefault ', function () {



        dispatcher.addEventListener("b", e => {
            return false;
        });
        dispatcher.addEventListener("a", e => {

        });


        assert.isFalse(dispatcher.dispatchEvent(new Event("b")));
        assert.isTrue(dispatcher.dispatchEvent(new Event("a")));
    });

    it('addEventListener accetta un oggetto Listener', function () {
        var listener = {
            prop: "prop",
            handleEvent: function (e) {
                assert.ok("passa per il listener");
                assert.equal(listener, this, "non mantiene il contesto");
                assert.equal(listener.prop, this.prop, "non è lo stesso oggetto");
                assert.equal(e.type, "a");
                assert.equal(e.target, dispatcher, "non è lo stesso target")
            }
        };
        dispatcher.addEventListener("a", listener);
        dispatcher.dispatchEvent(new Event("a"));

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
    it('removeEventListener: non ci sono più listeners', function () {

        let i = 0;
        const listener = e => i = i + 1;

        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 0, "");
    });
    it('removeEventListener: non c\'è quel listeners', function () {

        let i = 0;
        const listener = e => i = i + 1;
        dispatcher.addEventListener("b", listener);
        dispatcher.removeEventListener("b", function () {
        });

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 1, "");
    });
    it('removeEventListener senza listeners di quel type', function () {

        let i = 0;
        const listener = e => i = i + 1;

        dispatcher.addEventListener("a", listener);
        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("a"));
        assert.equal(i, 1, "");
    });
    it('removeEventListener con più listeners', function () {

        let i = 0;
        const listener = e => i = i + 1;

        dispatcher.addEventListener("b", listener);
        dispatcher.addEventListener("b", _ => 3);
        dispatcher.addEventListener("b", _ => _);
        dispatcher.removeEventListener("b", listener);

        dispatcher.dispatchEvent(new Event("b"));
        assert.equal(i, 0, "");
    });


});