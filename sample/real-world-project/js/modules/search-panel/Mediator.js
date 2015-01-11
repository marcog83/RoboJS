/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {

    var RoboJS = require("RoboJS");
    var SearchPanel = require("./SearchPanel");

    function Mediator() {
        RoboJS.display.Mediator.apply(this, arguments);
    }

    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function () {
                this.view=new SearchPanel(this.element);
                this.view.initialize();
            }
        }
    });
    module.exports = Mediator;
});