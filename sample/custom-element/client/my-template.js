/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module(dispatcher) {
        this.dispatcher = dispatcher;
        this.dispatcher.addEventListener("create-element", this.handleElementAdded.bind(this));
    }
    Module.prototype = Object.create(HTMLElement.prototype);
    Module.prototype.constructor = Module;
    Object.assign(Module.prototype , {

        handleElementAdded: function (e) {
            var id = e.detail;
            this.appendChild(document.createElement(id));
        },
        connectedCallback: function () {

        },
        disconnectedCallback: function () {

        }
    })


    return Module;
});