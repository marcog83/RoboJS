/**
 * Created by mgobbi on 05/04/2017.
 */
import {MediatorHandler} from "../src/display/MediatorHandler";
import {AHandler} from "../src/display/AHandler";
import {EventDispatcher} from "../src/events/EventTarget";
import {Disposable} from "../src/display/Disposable";
import _noop from "../src/internal/_noop";


var assert = require("chai").assert;

describe('MediatorHandler', function () {
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

    let handler, definitions = {a: Mediator, b: MediatorB};
    beforeEach(() => {
        handler = new MediatorHandler({definitions});
    });
    it('AHandler is a instanceof AHandler', function () {
        const ahandler = new AHandler({definitions});
        assert.instanceOf(ahandler, AHandler);
        assert.instanceOf(ahandler.dispatcher, EventDispatcher, "dispatcher non è un EventDispatcher");
        assert.isUndefined(ahandler.getDefinition());
        assert.isUndefined(ahandler.inCache());
        assert.isUndefined(ahandler.updateCache());
        assert.isUndefined(ahandler.hasMediator());
        assert.isUndefined(ahandler.create());
        assert.isUndefined(ahandler.getAllElements());
        assert.isUndefined(ahandler.destroy());
        assert.isUndefined(ahandler.dispose());
    });
    it('MediatorHandler is a instanceof AHandler', function () {
        assert.instanceOf(handler, AHandler);
    });


    it('handler.selector,handler.MEDIATORS_CACHE', function () {

        assert.equal(handler.selector, "data-mediator", "selector non è un data-mediator");
        assert.lengthOf(handler.MEDIATORS_CACHE, 0, "MEDIATORS_CACHE non è un []");
        assert.instanceOf(handler.dispatcher, EventDispatcher, "dispatcher non è un EventDispatcher");
        assert.equal(handler.definitions, definitions, "definitions non è definitions");


    });
    it('handler.getDefinition', function () {
        const div = document.createElement("div");
        div.dataset.mediator = "a";
        assert.equal(handler.getDefinition(div), Mediator)


    });
    it('handler.inCache', function () {
        const div = document.createElement("div");
        const div2 = document.createElement("div");
        div.dataset.mediator = "a";
        const disposable = new Disposable({node: div, dispose: _ => _, mediatorId: "123"});
        handler.MEDIATORS_CACHE.push(disposable);
        assert.isTrue(handler.inCache(div));
        assert.isFalse(handler.inCache(div2));

    });
    it('handler.updateCache', function () {
        const div = document.createElement("div");
        div.dataset.mediator = "a";
        const disposable = new Disposable({node: div, dispose: _ => _, mediatorId: "123"});
        handler.updateCache(disposable);
        assert.lengthOf(handler.MEDIATORS_CACHE, 1);
        assert.equal(handler.MEDIATORS_CACHE[0], disposable);

    });
    it('handler.hasMediator', function () {
        const div = document.createElement("div");
        div.dataset.mediator = "a";
        assert.isTrue(handler.hasMediator(div));

        const disposable = new Disposable({node: div, dispose: _ => _, mediatorId: "123"});
        handler.updateCache(disposable);
        assert.isFalse(handler.hasMediator(div));

        const divB = document.createElement("div");
        divB.dataset.mediator = "b";
        assert.isTrue(handler.hasMediator(divB));


    });
    it('handler.create', function () {
        const container = document.createElement("div");
        let div = document.createElement("div");
        div.dataset.mediator = "a";
        const dispose = _ => {

        };
        const Mediator = _ => dispose;
        //senza parentNode
        let disposable = handler.create(div, Mediator);
        assert.equal(disposable.mediatorId, div.getAttribute("mediatorid"));
        assert.equal(disposable.dispose, _noop);
        assert.equal(disposable.node, div);
        assert.equal(handler.MEDIATORS_CACHE[0], disposable);
        //con parentNode
        const div2 = document.createElement("div");
        div2.dataset.mediator = "b";
        container.appendChild(div2);
        disposable = handler.create(div2, Mediator);
        assert.equal(disposable.mediatorId, div2.getAttribute("mediatorid"));
        assert.equal(disposable.dispose, dispose);
        assert.equal(disposable.node, div2);
        assert.equal(handler.MEDIATORS_CACHE[1], disposable);


    });
    it('handler.getAllElements', function () {
        const container = document.createElement("div");
        let div = document.createElement("div");
        div.dataset.mediator = "a";
        const div2 = document.createElement("div");
        div2.dataset.mediator = "b";
        container.appendChild(div);
        container.appendChild(div2);
        let nodes = handler.getAllElements(container);
        assert.equal(nodes[0], div);
        assert.equal(nodes[1], div2);
        //compreso il container
        container.dataset.mediator = "c";
        nodes = handler.getAllElements(container);
        assert.equal(nodes[0], container);
        assert.equal(nodes[1], div);
        assert.equal(nodes[2], div2);

    });
    it('MediatorHandler.disposeMediator', function () {
        const div = document.createElement("div");
        div.dataset.mediator = "a";
        const dispose = () => {
            assert.ok("il dispose viene chiamato")
        };
        const disposable = new Disposable({node: div, dispose, mediatorId: "123"});
        MediatorHandler.disposeMediator(disposable);
        assert.isNull(disposable.node)

    });
    it('handler._destroy', function () {


    });
    it('handler.destroy', function () {


    });
    it('handler.dispose', function () {


    });
});