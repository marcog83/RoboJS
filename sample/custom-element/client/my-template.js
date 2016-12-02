/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module() {
        return {
            createdCallback: function () {
                this.dispatcher.addEventListener("create-element", this.handleElementAdded.bind(this));

            },
            handleElementAdded: function (e) {
                var id=e.data;
                this.appendChild(document.createElement(id));
            },
            attachedCallback: function () {

            },
            detachedCallback: function () {

            }
        }


    }


    return Module;
});