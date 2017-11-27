/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module(dispatcher) {
        this.dispatcher=dispatcher;
        this.count = 0;
        this.dispatcher.addEventListener("create-element", function (e) {
            var thumb_id = e.data;
            var id = this.getAttribute("data-id");
            if (thumb_id === id) {
                this.update();
            }
        }.bind(this))
    }

    Module.prototype = {

        update: function () {
            this.count++;
            this.innerHTML = this.count;
        },


        connectedCallback: function () {
            this.innerHTML = this.count;
        },
        disconnectedCallback: function () {

        }
    }


    return Module;
});