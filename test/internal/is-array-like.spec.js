import {isArrayLike} from "../../src/internal/index";


var assert = require("chai").assert;
describe('isArrayLike', function() {
    it('is true for Arrays', function() {
        assert.equal(isArrayLike([]), true);
        assert.equal(isArrayLike([1, 2, 3, 4]), true);
        assert.equal(isArrayLike([null]), true);
    });

    it('is true for arguments', function() {
        function test() {
            return isArrayLike(arguments);
        }
        assert.equal(test(), true);
        assert.equal(test(1, 2, 3), true);
        assert.equal(test(null), true);
    });

    it('is false for Strings', function() {
        assert.equal(isArrayLike(''), false);
        assert.equal(isArrayLike('abcdefg'), false);
    });

    it('is true for arbitrary objects with numeric length, if extreme indices are defined', function() {
        var obj1 = {length: 0};
        var obj2 = {0: 'something', length: 0};
        var obj3 = {0: void 0, length: 0};
        var obj4 = {0: 'zero', 1: 'one', length: 2};
        var obj5 = {0: 'zero', length: 2};
        var obj6 = {1: 'one', length: 2};
        assert.equal(isArrayLike(obj1), true);
        assert.equal(isArrayLike(obj2), true);
        assert.equal(isArrayLike(obj3), true);
        assert.equal(isArrayLike(obj4), true);
        assert.equal(isArrayLike(obj5), false);
        assert.equal(isArrayLike(obj6), false);
    });

    it('is false for everything else', function() {
        assert.equal(isArrayLike(undefined), false);
        assert.equal(isArrayLike(1), false);
        assert.equal(isArrayLike({}), false);
        assert.equal(isArrayLike(false), false);
        assert.equal(isArrayLike(function() {}), false);
    });
    it('has length 1', function () {
        assert.lengthOf(isArrayLike, 1);

    });

});