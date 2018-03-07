/**
 * Created by mgobbi on 05/04/2017.
 */
import DomWatcher from "../src/core/display/dom-watcher";
import Signal from "../src/core/events/signal";


var assert = require("chai").assert;
require('./libs/MutationObserver');


describe('dom-watcher', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })

    beforeEach(() => {
        global.mutations={
            addedNodes:[]
            ,removedNodes:[]
        }
    })
    it('it is a function', function () {
        assert.isFunction(DomWatcher);
    });
    it('arity 2', function () {
        assert.lengthOf(DomWatcher, 2);
    });

    it('ritorna un Oggetto', function () {

        assert.isObject(DomWatcher({},()=>{}), "non ritorna un Oggetto");

    });
    it('L\'oggetto ritornato ha 3 proprietà, 2 Signal e dispose', function () {
        var {onAdded,onRemoved,dispose} = DomWatcher({},()=>{});

        assert.instanceOf(onAdded, Signal, "onAdded non è un Signal");
        assert.instanceOf(onRemoved, Signal, "onRemoved non è un Signal");
        assert.isFunction(dispose, "dispose non è una funzione");
        dispose();
    });


});