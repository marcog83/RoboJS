/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


    function Module(dispatcher) {
        this.dispatcher = dispatcher;

    }

    Module.prototype = Object.create(HTMLElement.prototype);
    Module.prototype.constructor = Module;
    Object.assign(Module.prototype, {

        handleLoaded: function (e) {
            var thumbnails = JSON.parse(e.currentTarget.responseText);
            console.log(this,this.innerHTML)
            this.innerHTML = thumbnails.reduce(function (prev, curr) {
                return prev.concat("<my-thumbnail id='" + curr + "'>" + curr + "</my-thumbnail>");
            }, "<div class='thumbnails'>").concat("</div>");


        },
        connectedCallback: function () {
            console.log("attached my-custom-element", this)
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "components.json");
            xhr.onload = function (e) {
                this.handleLoaded(e);
            }.bind(this);
            xhr.send();
        },
        disconnectedCallback: function () {
            console.log("deattached my-custom-element", this)
        }
    })


    module.exports = Module;
});