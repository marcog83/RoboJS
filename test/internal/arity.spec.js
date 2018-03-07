import {arity} from "../../src/internal/index";


var assert = require("chai").assert;
describe('arity', function () {
    it('returns correct arguments', function () {
        arity(0, function fn() {
            assert.equal(arguments.length, 0)
        })();
        //
        arity(1, function fn() {
            assert.equal(arguments.length, 1)
        })(1);
        //
        arity(2, function fn() {
            assert.equal(arguments.length, 2)
        })(1, 2);
        //
        arity(3, function fn() {
            assert.equal(arguments.length, 3)
        })(1, 2, 3);
        //
        arity(4, function fn() {
            assert.equal(arguments.length, 4)
        })(1, 2, 3, 4);
        //
        arity(5, function fn() {
            assert.equal(arguments.length, 5)
        })(1, 2, 3, 4, 5);
        //
        arity(6, function fn() {
            assert.equal(arguments.length, 6)
        })(1, 2, 3, 4, 5, 6);
        //
        arity(7, function fn() {
            assert.equal(arguments.length, 7)
        })(1, 2, 3, 4, 5, 6, 7);
        //
        arity(8, function fn() {
            assert.equal(arguments.length, 8)
        })(1, 2, 3, 4, 5, 6, 7, 8);
        //
        arity(9, function fn() {
            assert.equal(arguments.length, 9)
        })(1, 2, 3, 4, 5, 6, 7, 8, 9);
        //
        arity(10, function fn() {
            assert.equal(arguments.length, 10)
        })(1, 2, 3, 4, 5, 6, 7, 8, 9, 0);

        try {
            arity(11, function fn() {
                assert.fail("non più di 10 arguments")
            })();

        } catch (e) {
            assert.ok("sì! va in error");
        }

    });

    it('has length 2', function () {
        assert.lengthOf(arity, 2);

    });

});