/**
 * Created by mgobbi on 05/04/2017.
 */
import {MediatorHandler} from "../src/display/MediatorHandler";
import {DomWatcher} from "../src/display/DomWatcher";
import {Signal} from "../src/events/Signal";


var assert = require("chai").assert;
require('./libs/MutationObserver');


describe('DomWatcher', function () {
    before(function () {
        this.jsdom = require('jsdom-global')()
    });

    after(function () {
        this.jsdom()
    });

    let watcher, handler, mutations;
    const definitions = {};
    let div1

    let div2
    let div3 ;
    beforeEach(() => {
        handler = new MediatorHandler({definitions});
        document.body.innerHTML = "";
        watcher = new DomWatcher(document.body, handler);
         div1 = document.createElement("div");

         div2 = document.createElement("div");
         div3 = document.createElement("div");
        div1.setAttribute("data-mediator", "a");
        div2.setAttribute("data-mediator", "b");

        document.body.appendChild(div1);
        document.body.appendChild(div2);
        document.body.appendChild(div3);

        mutations = [{
            addedNodes: [document.body.querySelectorAll("*")]
            , removedNodes: [document.body.querySelectorAll("*")]
        }]
    });
    it('DomWatcher is instanceOf DomWatcher', function () {
        assert.instanceOf(watcher, DomWatcher);
    });


    it('L\'oggetto ritornato ha 3 proprietà, 2 Signal e dispose', function () {


        assert.instanceOf(watcher.onAdded, Signal, "onAdded non è un Signal");
        assert.instanceOf(watcher.onRemoved, Signal, "onRemoved non è un Signal");
        assert.isFunction(watcher.dispose, "dispose non è una funzione");
        watcher.dispose();
    });
    it("watcher.handleMutations", () => {
        watcher.onAdded.connect(nodes=>{
            assert.equal(div1,nodes[0]);
            assert.equal(div2,nodes[1]);
            assert.lengthOf(nodes,2);
        });
        watcher.onRemoved.connect(nodes=>{
            assert.equal(div1,nodes[0]);
            assert.equal(div2,nodes[1]);
            assert.lengthOf(nodes,2);
        });
        watcher.handleMutations(mutations)
    })

});