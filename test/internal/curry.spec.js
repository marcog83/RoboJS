import {curry} from "../../src/internal/index";


var assert = require("chai").assert;
describe('curry', function() {
    it('curries a single value', function() {
        var f = curry(function(a) {return a*2;}); // f(12) == 24
        var g = f();
        assert.equal(f, g);
        assert.equal(g(12), 24);
    });
    it('curries a single value', function() {
        var f = curry(function(a, b, c, d) {return (a + b * c) / d;}); // f(12, 3, 6, 2) == 15
        var g = f(12);
        assert.equal(g(3, 6, 2), 15);
    });

    it('curries multiple values', function() {
        var f = curry(function(a, b, c, d) {return (a + b * c) / d;}); // f(12, 3, 6, 2) == 15
        var g = f(12, 3);
        assert.equal(g(6, 2), 15);
        var h = f(12, 3, 6);
        assert.equal(h(2), 15);
    });

    it('allows further currying of a curried function', function() {
        var f = curry(function(a, b, c, d) {return (a + b * c) / d;}); // f(12, 3, 6, 2) == 15
        var g = f(12);
        assert.equal(g(3, 6, 2), 15);
        var h = g(3);
        assert.equal(h(6, 2), 15);
        assert.equal(g(3, 6)(2), 15);
    });

    it('properly reports the length of the curried function', function() {
        var f = curry(function(a, b, c, d) {return (a + b * c) / d;});
        assert.equal(f.length, 4);
        var g = f(12);
        assert.equal(g.length, 3);
        var h = g(3);
        assert.equal(h.length, 2);
        assert.equal(g(3, 6).length, 1);
    });

    it('preserves context', function() {
        var ctx = {x: 10};
        var f = function(a, b) { return a + b * this.x; };
        var g = curry(f);

        assert.equal(g.call(ctx, 2, 4), 42);
        assert.equal(g.call(ctx, 2).call(ctx, 4), 42);
    });





    it('forwards extra arguments', function() {
        var f = function(a, b, c) {
            void c;
            return Array.prototype.slice.call(arguments);
        };
        var g = curry(f);

        assert.deepEqual(g(1, 2, 3), [1, 2, 3]);
        assert.deepEqual(g(1, 2, 3, 4), [1, 2, 3, 4]);
        assert.deepEqual(g(1, 2)(3, 4), [1, 2, 3, 4]);
        assert.deepEqual(g(1)(2, 3, 4), [1, 2, 3, 4]);
        assert.deepEqual(g(1)(2)(3, 4), [1, 2, 3, 4]);
    });

});

