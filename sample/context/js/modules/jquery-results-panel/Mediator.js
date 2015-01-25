/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var RoboJS = require("robojs");

    function Mediator(view) {
        RoboJS.display.Mediator.inherit(this, arguments);
        this.view = view;
    }


    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function (element) {

                this.view.initialize(element);
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