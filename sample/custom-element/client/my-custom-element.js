/**
 * Created by marco.gobbi on 09/12/2014.
 */

define(function (require, exports, module) {


    function FooElement() {
        return {
            createdCallback: function () {
                console.log("created my-custom-element", this);
                this.addEventListener("click",function(e){
                    e.currentTarget.parentElement.removeChild(e.currentTarget);
                    e.stopPropagation();
                })
            },
            attachedCallback: function () {
                console.log("attached my-custom-element", this)
            },
            detachedCallback: function () {
                console.log("deattached my-custom-element", this)
            }
        }


    }


    module.exports = FooElement;
});