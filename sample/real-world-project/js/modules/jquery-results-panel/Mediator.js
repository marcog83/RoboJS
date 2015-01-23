/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var RoboJS = require("robojs");
    var ResultsPanel = require("./ResultsPanel");
    function Mediator() {
        RoboJS.display.Mediator.inherit(this, arguments);
    }
    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function (element) {
                this.view = new ResultsPanel(element);
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