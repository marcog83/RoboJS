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


        handler.REGISTERED_ELEMENTS["my-component"] = true;
        assert.isTrue(handler.inCache("my-component"));
        assert.isFalse(handler.inCache("my-component-b"));

    });
    it('handler.updateCache', function () {
        handler.updateCache("my-component");
        assert.isTrue(handler.REGISTERED_ELEMENTS["my-component"]);


    });
    it('handler.hasMediator', function () {

        const div = document.createElement("my-component");

        assert.isTrue(handler.hasMediator(div));

        handler.updateCache("my-component");
        assert.isFalse(handler.hasMediator(div));

        const divB = document.createElement("my-component-b");

        assert.isTrue(handler.hasMediator(divB));

    });
    //FIXME https://github.com/jsdom/jsdom/issues/1030
    it('handler.create', function () {
        let div = document.createElement("my-component");
        let div2 = document.createElement("my-component");
        let div3 = document.createElement("div");
        window.HTMLElement=function HTMLElement() {

        }
        window.customElements = {
            define(tagName, Clazz) {
                assert.equal(tagName, "my-component");
                const instance = new Clazz();
                assert.instanceOf(instance, MyMediator);
                 assert.equal(instance.dispatcher, handler.dispatcher);
            }
        };



        class MyMediator extends window.HTMLElement {
            constructor(dispatcher) {
                super();
                this.dispatcher = dispatcher;
            }
        };

        handler.create(div, MyMediator);
        handler.create(div2, MyMediator);
        assert.isTrue(handler.REGISTERED_ELEMENTS["my-component"]);
        assert.throws(()=>{
            handler.create(div3,MyMediator)
        },Error);


    });

    it('handler.getAllElements', function () {
        let container1 = document.createElement("div");
        let container2 = document.createElement("my-component");
        let div = document.createElement("my-component-b");
        let div2 = document.createElement("my-component");
        container1.appendChild(div);
        div.appendChild(div2);
        let childrenNoRoot=handler.getAllElements(container1);
        assert.sameMembers(childrenNoRoot,[div,div2]);
        container2.appendChild(div);
        let childrenRoot=handler.getAllElements(container2);
        assert.sameMembers(childrenRoot,[container2,div,div2]);

    });

});