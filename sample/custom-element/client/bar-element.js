define(function (require, exports, module) {


    function BarElement() {
        return {
            createdCallback: function () {
                console.log("created bar element", this)
            },
            attachedCallback: function () {
                console.log("attached bar element", this)
            },
            detachedCallback: function () {
                console.log("deattached bar element", this)
            }
        }


    }


    module.exports = BarElement;
});