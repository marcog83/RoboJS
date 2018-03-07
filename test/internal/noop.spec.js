import {noop} from "../../src/internal/index";


var assert = require("chai").assert;
describe('noop', function () {
    it('returns its first argument', function () {
        assert.equal(noop(undefined), undefined);
        assert.equal(noop('foo'), 'foo');
        assert.equal(noop('foo', 'bar'), 'foo');
    });

    it('has length 1', function () {
        assert.lengthOf(noop, 1);

    });

});