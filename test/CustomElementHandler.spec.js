/**
 * Created by mgobbi on 05/04/2017.
 */

import {AHandler} from "../src/display/AHandler";
import {EventDispatcher} from "../src/events/EventTarget";
import {Disposable} from "../src/display/Disposable";
import _noop from "../src/internal/_noop";
import {CustomElementHandler} from "../src/display/CustomElementHandler";


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
        handler = new CustomElementHandler({definitions});
    });

    it('MediatorHandler is a instanceof AHandler', function () {
        assert.instanceOf(handler, AHandler);
    });


    it('handler.selector,handler.MEDIATORS_CACHE', function () {




    });
    it('handler.getDefinition', function () {



    });
    it('handler.inCache', function () {


    });
    it('handler.updateCache', function () {


    });
    it('handler.hasMediator', function () {



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