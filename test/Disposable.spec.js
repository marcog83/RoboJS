import {Disposable} from "../src/display/Disposable";
import _noop from "../src/internal/_noop";


var assert = require("chai").assert;

describe('Disposable', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    });

    after(function () {
        this.jsdom()
    });

    function myDispose() {
    }


    let disposable;
    beforeEach(() => {
        disposable = new Disposable();
    });

    it('Disposable is a instanceof Disposable', function () {
        assert.instanceOf(disposable, Disposable);
    });

    it('handler default', function () {
        assert.equal(disposable.mediatorId, "");
        assert.isNull(disposable.node);
        assert.equal(disposable.dispose, _noop);


    });
    it('handler.mediatorId', function () {
        const config = {mediatorId: "mediatorId"};
        disposable = new Disposable(config);
        assert.equal(disposable.mediatorId, config.mediatorId);
    });

    it('handler.node', function () {
        const myNode = {a: 1, b: 2};
        const config = {node: myNode};
        disposable = new Disposable(config);
        assert.equal(disposable.node, config.node);
    });

    it('handler.dispose', function () {
        const config = {dispose: myDispose};
        disposable = new Disposable(config);
        assert.equal(disposable.dispose, config.dispose);
    });
});