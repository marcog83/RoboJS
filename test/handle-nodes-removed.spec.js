/**
 * Created by mgobbi on 05/04/2017.
 */
import HandleNodesRemoved from "../src/core/display/handle-nodes-removed";
var assert = require("chai").assert;

describe('HandleNodesRemoved', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    })

    after(function () {
        this.jsdom()
    })

    function destroy() {
    }

    it('it is a function', function () {

        assert.isFunction(HandleNodesRemoved);
    });
    it('arity 2', function () {
        assert.lengthOf(HandleNodesRemoved, 1);
    });
    it('ritorna una funzione', function () {
        function destroy() {
        }

        var handleNodesRemoved = HandleNodesRemoved(destroy);
        assert.isFunction(handleNodesRemoved);
    });
    it('esegue la funzione destroy per ogni elemento passato', function () {
        var destroyed = [];
        var items = [{b: 3}, {a: 2}, {c: 5}];

        function destroy(item) {
            destroyed.push(item);
        }

        var handleNodesRemoved = HandleNodesRemoved(destroy);
        assert.sameDeepMembers(handleNodesRemoved(items), destroyed);
    });

});