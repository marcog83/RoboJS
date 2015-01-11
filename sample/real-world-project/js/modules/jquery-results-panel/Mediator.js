/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var RoboJS = require("RoboJS");
    var ResultsPanel = require("./ResultsPanel");
    function Mediator() {
        RoboJS.display.Mediator.apply(this, arguments);
    }
    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function () {
                this.view = new ResultsPanel(this.element);
                this.view.initialize();
                this.addContextListener("search-done",this._handleSearchDone,this)

            }
        },
        _handleSearchDone: {
            value: function (data) {
                this.view.update(data);
            }
        }
    });
    module.exports =Mediator;
});