define(function (require, exports, module) {


    function BarElement(dispatcher) {
        this.dispatcher = dispatcher;
        console.log("created bar element", this)
    }

    BarElement.prototype = {
        connectedCallback: function () {
            console.log("attached bar element", this)
        },
        disconnectedCallback: function () {
            console.log("deattached bar element", this)
        }
    }


    module.exports = BarElement;
});