/**
 * Created by mgobbi on 03/02/2016.
 */
define(function (require) {
    var rjs = require("robojs");

    function Module(dispatcher) {
        this.dispatcher = dispatcher;
        this.counter = document.createElement("my-counter");
        this.counter.setAttribute("data-id", this.id);


        this.addEventListener("click", function () {
            this.dispatcher.dispatchEvent(new rjs.RJSEvent("create-element", this.id));
        }.bind(this));
    }

    Module.prototype = Object.create(HTMLElement.prototype);
    Module.prototype.constructor = Module;
    Object.assign(Module.prototype, {


        connectedCallback: function () {
            this.appendChild(this.counter);
        },
        disconnectedCallback: function () {
            console.log("deattached my-custom-element", this)
        }
    });


    return Module;
});