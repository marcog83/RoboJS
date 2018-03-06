/**
 * Created by mgobbi on 05/04/2017.
 */

import Signal from "../src/core/events/signal";

var assert = require("chai").assert;


describe('Signal', function () {


    it('it is a function', function () {

        assert.isFunction(Signal);
    });

    it('ritorna un oggetto con le funzioni esposte', function () {
        let signal = new Signal();
        /*
         connect,
         connectOnce,
         disconnect,
         disconnectAll,
         emit
         * */

        assert.isFunction(signal.connect);
        assert.isFunction(signal.connectOnce);
        assert.isFunction(signal.disconnect);
        assert.isFunction(signal.disconnectAll);
        assert.isFunction(signal.emit);
    });
    it('emit dispaccia correttamente a 1 listener', function () {
        var params = [12345, 'text', {a: 1}];
        let signal = new Signal();

        signal.connect(_params => assert.equal(_params, params));
        signal.emit(params);
    });
    it('emit dispaccia correttamente a più listeners', function () {
        var params = [12345, 'text', {a: 1}];
        let signal = new Signal();

        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.emit(params);
    });
    it('connect connette lo stesso listener/scope solo una volta', function () {

        let signal = new Signal();
        const listener = _ => _;
        signal.connect(listener);
        signal.connect(listener);
        signal.connect(listener);
        signal.connect(listener);

        assert.lengthOf(signal.listenerBoxes, 1, "");
    });
    it('connect connette listener con scope differenti', function () {

        let signal = new Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = _ => _;
        signal.connect(listener);
        signal.connect(listener, scope);
        signal.connect(listener, scope2);
        //
        signal.connect(listener);
        signal.connect(listener, scope2);
        signal.connect(listener, scope);


        assert.lengthOf(signal.listenerBoxes, 3, "");
    });
    it('disconnect rimuove correttamente il listener', function () {

        let signal = new Signal();
        const listener = _ => assert.fail("[listener è stato chiamato]", "[il listener doveva essere eliminato]", "gli slots non si rimuovono correttamente");
        signal.connect(listener);
        signal.disconnect(listener);
        signal.emit({});
        assert.isOk(true, 'il listener è stato cancellato');
    });
    it('disconnect rimuove listener con scope differenti', function () {

        let signal = new Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = function (p) {
            assert.equal(this, scope, "lo scope disconnesso è ancora in giro");
        };
        signal.connect(listener, scope2);
        signal.connect(listener, scope);
        signal.disconnect(listener, scope2);
        assert.lengthOf(signal.listenerBoxes, 1, "");
        signal.emit({});

    });
    it('disconnectAll rimuove tutti i listeners', function () {

        let signal = new Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = function (p) {
            assert.fail("doveva essere eliminato");
        };
        signal.connect(listener, scope2);
        signal.connect(listener);
        signal.connect(listener, scope);
        signal.connect(_ => assert.fail("doveva essere eliminato"), scope);
        signal.disconnectAll();

        signal.emit({});
        assert.lengthOf(signal.listenerBoxes, 0, "");
    });
    it("getNumListeners", function () {
        let signal = new Signal();
        const scope2 = {a: 1};
        const listener = function (p) {

        };
        signal.connect(listener, scope2);
        signal.connect(listener);
        signal.emit({});
        assert.equal(signal.getNumListeners(), 2, "");
    })
    //
    it("connectOnce: un solo listener", function () {
        let signal = new Signal();

        const listener = function (p) {

        };
        signal.connectOnce(listener);
        signal.connectOnce(listener);
        //  signal.emit({});

        assert.equal(signal.getNumListeners(), 1, "");
    })
    it("connectOnce:emit una sola volta", function () {
        let signal = new Signal();
        var i = 0;
        const listener = function (p) {
            i = p;
        };
        signal.connectOnce(listener);
        signal.connectOnce(listener);
        signal.emit(7);

        assert.equal(signal.getNumListeners(), 0, "una volta fatto emit viene eliminato il listener");
        assert.equal(i, 7, "il valore di emit viene passato correttamente");
    })
    it("connectOnce:emit connect dentro listener!!!bomba", function () {
        let signal = new Signal();
        var i = 0;
        const listener = function (p) {
            
            signal.connect(k=>{
                i=k;
            });
            i=p;
        };
        signal.connect(listener);

        signal.emit(7);
        signal.emit(8);
        assert.equal(signal.getNumListeners(), 3);
        assert.equal(i, 8, "il valore di emit viene passato correttamente");
    })
    it("connectOnce: no connectOnce e connect", function () {
        let signal = new Signal();

        const listener = function (p) {

        };
        signal.connectOnce(listener);
        try {
            signal.connect(listener);
            assert.fail("no! deve andare in errore");

        } catch (e) {
            assert.ok("sì! va in error");
        }


    })
    it("connectOnce: no connect e connectOnce", function () {
        let signal = new Signal();

        const listener = function (p) {

        };
        signal.connect(listener);

        try {
            signal.connectOnce(listener);
            assert.fail("no! deve andare in errore");

        } catch (e) {
            assert.ok("sì! va in error");
        }
    })
});