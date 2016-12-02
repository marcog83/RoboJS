/**
 * Created by mgobbi on 03/02/2016.
 */
define(function (require) {
    var rjs=require("robojs");
    function Module() {
        return {
            createdCallback: function () {
                this.counter = document.createElement("my-counter");
                this.counter.setAttribute("data-id", this.id);


                this.addEventListener("click", function () {
                    this.dispatcher.dispatchEvent(new rjs.RJSEvent("create-element", this.id));
                }.bind(this));

            },

            attachedCallback: function () {
                this.appendChild(this.counter);
            },
            detachedCallback: function () {
                console.log("deattached my-custom-element", this)
            }
        }


    }


    return Module;
});