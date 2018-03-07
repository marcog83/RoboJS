/**
 * Created by mgobbi on 05/04/2017.
 */
import GetMediators from "../src/core/display/get-mediators";
var assert = require("chai").assert;

describe('GetMediators', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })
    function findMediator(item) {
        return Promise.resolve(item);
    }

    function hasMediatorTrue() {
        return true;
    }

    function hasMediatorFalse() {
        return false;
    }

    function hasMediator(item) {
        // filtra i mediatori
        return item % 3 === 0;
    }

    it('it is a function', function () {

        assert.isFunction(GetMediators);
    });
    it('arity 2', function () {
        assert.lengthOf(GetMediators, 2);
    });
    it('ritorna una funzione', function () {
        var getMediators = GetMediators(findMediator, hasMediatorTrue);
        assert.isFunction(getMediators);
    });
    it('getMediators: ritorna una Promise', function () {
        var getMediators = GetMediators(findMediator, hasMediatorTrue);
        assert.instanceOf(getMediators([[1, 2, 3]]), Promise);
    });
    it("getMediators: la promise risolta contiene l'array dei mediatori", function (done) {
        var getMediators = GetMediators(findMediator, hasMediatorTrue);
        var items = [1, 2, 3];
        getMediators([items]).then(function (response) {
            assert.sameDeepMembers(response, items);
            done();
        }).catch(done);

    });
    it("getMediators: la promise risolta contiene l'array dei mediatori. Non trova risultati", function (done) {
        var getMediators = GetMediators(findMediator, hasMediatorFalse);
        var items = [1, 2, 3];
        getMediators([items]).then(function (response) {
            assert.lengthOf(response, 0);
            done();
        }).catch(done);

    });
    it("getMediators: la promise risolta contiene l'array dei mediatori.I risultati sono filtrati", function (done) {
        var getMediators = GetMediators(findMediator, hasMediator);
        var items = [1, 2, 3];
        /* hasMediator filtra solo item % 3 === 0;
         * */
        getMediators([items]).then(function (response) {
            assert.sameDeepMembers(response, [3]);
            done();
        }).catch(done);

    });
});