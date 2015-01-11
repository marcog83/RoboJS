/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var RoboJS = require("RoboJS");
    var ToggleModule = require("./ToggleModule");
    function Mediator() {
        RoboJS.display.Mediator.apply(this, arguments);
    }
    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function () {
                this.view = new ToggleModule(this.element);

            }
        }
    });
    module.exports =Mediator;
});