/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


    function Module(dispatcher) {
        this.dispatcher = dispatcher;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "components.json");
        xhr.onload = function (e) {
            this.handleLoaded(e);
        }.bind(this);
        xhr.send();
    }

    Module.prototype = {

        handleLoaded: function (e) {
            var thumbnails = JSON.parse(e.currentTarget.responseText);
            this.innerHTML = thumbnails.reduce(function (prev, curr) {
                return prev.concat("<my-thumbnail id='" + curr + "'>" + curr + "</my-thumbnail>");
            }, "<div class='thumbnails'>").concat("</div>");


        },
        connectedCallback: function () {
            console.log("attached my-custom-element", this)
        },
        disconnectedCallback: function () {
            console.log("deattached my-custom-element", this)
        }
    }


    module.exports = Module;
});