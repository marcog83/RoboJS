/**
 * Created by mgobbi on 03/02/2016.
 */
define(function () {
    function Module(dispatcher) {
        return {
            createdCallback: function () {
                dispatcher.addEventListener("create-element", this.handleElementAdded.bind(this));

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