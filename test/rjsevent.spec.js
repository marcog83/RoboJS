/**
 * Created by mgobbi on 05/04/2017.
 */

import RJSEvent from "../src/core/events/rjs-event";
var assert = require("chai").assert;


describe('RJSEvent', function () {

    before(function () {
        this.jsdom = require('jsdom-global')();
    });

    after(function () {
        this.jsdom();
    });
    var event,eventName="my-event",data=42,bubbles=true,cancelable=true;
    beforeEach(function () {
        event = new RJSEvent(eventName,data,bubbles,cancelable);

    });

    it('event: it is a object', function () {

        assert.isObject(event);
    });
    it('event un oggetto  con proprietà default', function () {

        event = new RJSEvent(eventName);

        assert.equal( event.data,null);
        assert.equal( event.type,eventName);
        assert.equal( event.cancelable,false);
        assert.equal( event.bubbles,false);
        assert.equal( event.defaultPrevented,false);
        assert.equal( event.propagationStopped,false);
        assert.equal( event.immediatePropagationStopped,false);
        assert.equal( event.removed,false);
        assert.equal( event.eventPhase,0);
        event.preventDefault();
        event.stopPropagation();
        event.remove();
        assert.equal( event.defaultPrevented,true);
        assert.equal( event.propagationStopped,true);
        assert.equal( event.removed,true);
    });
    it('event un oggetto  con proprietà esposte', function () {

        assert.equal( event.data,data);
        assert.equal( event.type,eventName);
        assert.equal( event.bubbles,bubbles);
        assert.equal( event.cancelable,cancelable);
        assert.equal( event.defaultPrevented,false);
        assert.equal( event.propagationStopped,false);
        assert.equal( event.immediatePropagationStopped,false);
        assert.equal( event.removed,false);
        assert.equal( event.eventPhase,0);


    });
    it("event viene clonato",function(){
        // event = new RJSEvent(eventName);
        var cloned=event.clone();
        assert.equal( cloned.data,data);
        assert.equal( cloned.type,eventName);
        assert.equal( cloned.bubbles,bubbles);
        assert.equal( cloned.cancelable,cancelable);
        assert.equal( cloned.defaultPrevented,false);
        assert.equal( cloned.propagationStopped,false);
        assert.equal( cloned.immediatePropagationStopped,false);
        assert.equal( cloned.removed,false);
        assert.equal( cloned.eventPhase,0);
    });
    it("event.stopImmediatePropagation",function(){
        event.stopImmediatePropagation();

        assert.equal( event.propagationStopped,true);
        assert.equal( event.immediatePropagationStopped,true);

    });




});