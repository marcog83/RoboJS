/**
 * Created by mgobbi on 05/04/2017.
 */

import {AHandler} from "../src/display/AHandler";
import {EventDispatcher} from "../src/events/EventTarget";
import {Disposable} from "../src/display/Disposable";
import _noop from "../src/internal/_noop";
import {CustomElementHandler} from "../src/display/CustomElementHandler";


var assert = require("chai").assert;

describe('CustomElementHandler', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    });

    after(function () {
        this.jsdom()
    });

    function Mediator() {
    }

    function MediatorB() {
    }

    let handler, definitions = {"my-component": Mediator, "my-component-b": MediatorB};
    beforeEach(() => {
        handler = new CustomElementHandler({definitions});
    });

    it('CustomElementHandler is a instanceof AHandler', function () {
        assert.instanceOf(handler, AHandler);
    });


    it('handler.selector,handler.REGISTERED_ELEMENTS', function () {
        assert.isObject(handler.REGISTERED_ELEMENTS, "REGISTERED_ELEMENTS non è un {}");
        assert.instanceOf(handler.dispatcher, EventDispatcher, "dispatcher non è un EventDispatcher");
        assert.equal(handler.definitions, definitions, "definitions non è definitions");

    });
    it('handler.getDefinition', function () {

        const div = document.createElement("my-component");

        assert.equal(handler.getDefinition(div), Mediator)

    });
    it('handler.inCache', function () {


         handler.REGISTERED_ELEMENTS["my-component"]=true;
        assert.isTrue(handler.inCache("my-component"));
        assert.isFalse(handler.inCache("my-component-b"));

    });
    it('handler.updateCache', function () {
         handler.updateCache("my-component");
        assert.isTrue( handler.REGISTERED_ELEMENTS["my-component"]);


    });
    it('handler.hasMediator', function () {

        const div = document.createElement("my-component");

        assert.isTrue(handler.hasMediator(div));

         handler.updateCache("my-component");
        assert.isFalse(handler.hasMediator(div));

        const divB = document.createElement("my-component-b");

        assert.isTrue(handler.hasMediator(divB));

    });
    it('handler.create', function () {



    });
    it('handler.getAllElements', function () {


    });
    it('MediatorHandler.disposeMediator', function () {


    });
    it('handler._destroy', function () {


    });
    it('handler.destroy', function () {


    });
    it('handler.dispose', function () {


    });
});