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
        let signal = Signal();
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
        let signal = Signal();

        signal.connect(_params => assert.equal(_params, params));
        signal.emit(params);
    });
    it('emit dispaccia correttamente a più listeners', function () {
        var params = [12345, 'text', {a: 1}];
        let signal = Signal();

        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.connect(_params => assert.equal(_params, params));
        signal.emit(params);
    });
    it('connect connette lo stesso listener/scope solo una volta', function () {

        let signal = Signal();
        const listener = _ => _;
        let slots = signal.connect(listener);
        slots = signal.connect(listener);
        slots = signal.connect(listener);
        slots = signal.connect(listener);

        assert.lengthOf(slots, 1, "");
    });
    it('connect connette listener con scope differenti', function () {

        let signal = Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = _ => _;
        let slots = signal.connect(listener);
        slots = signal.connect(listener, scope);
        slots = signal.connect(listener, scope2);
        //
        slots = signal.connect(listener);
        slots = signal.connect(listener, scope2);
        slots = signal.connect(listener, scope);


        assert.lengthOf(slots, 3, "");
    });
    it('disconnect rimuove correttamente il listener', function () {

        let signal = Signal();
        const listener = _ => assert.fail("[listener è stato chiamato]", "[il listener doveva essere eliminato]", "gli slots non si rimuovono correttamente");
        signal.connect(listener);
        signal.disconnect(listener);
        signal.emit({});
        assert.isOk(true, 'il listener è stato cancellato');
    });
    it('disconnect rimuove listener con scope differenti', function () {

        let signal = Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = function (p) {
            assert.equal(this, scope, "lo scope disconnesso è ancora in giro");
        };
        let slots = signal.connect(listener, scope2);
        slots = signal.connect(listener, scope);
        slots = signal.disconnect(listener, scope2);
        assert.lengthOf(slots, 1, "");
        signal.emit({});

    });
    it('disconnectAll rimuove tutti i listeners', function () {

        let signal = Signal();
        const scope = {};
        const scope2 = {a: 1};
        const listener = function (p) {
            assert.fail("doveva essere eliminato");
        };
        signal.connect(listener, scope2);
        signal.connect(listener);
        signal.connect(listener, scope);
        signal.connect(_ => assert.fail("doveva essere eliminato"), scope);
        let slots = signal.disconnectAll();
        assert.equal(slots, null, "");
        signal.emit({});

    });
});