/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module() {
        return {
            createdCallback: function () {
                this.counter = document.createElement("my-counter");
                this.counter.setAttribute("data-id", this.id);


                this.addEventListener("click", function () {
                    this.dispatcher.dispatchEvent("create-element", this.id);
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