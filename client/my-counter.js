/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module(dispatcher) {
        return {
            createdCallback: function () {
                this.count = 0;
                dispatcher.addEventListener("create-element", function (e) {
                    var thumb_id=e.data;
                    var id = this.getAttribute("data-id");
                    if (thumb_id === id) {
                        this.update();
                    }
                }.bind(this))


            },
            update: function () {
                this.count++;
                this.innerHTML = this.count;
            },


            attachedCallback: function () {
                this.innerHTML = this.count;
            },
            detachedCallback: function () {

            }
        }


    }


    return Module;
});