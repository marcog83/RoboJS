/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {

    var RoboJS = require("robojs");


    function Mediator(searchPanel) {

        RoboJS.display.Mediator.inherit(this, arguments);
        this.view =searchPanel;
    }


    Mediator.prototype = Object.create(RoboJS.display.Mediator.prototype, {

        initialize: {
            value: function (element) {

                this.view.onSearchDone.connect(this._handleSearchDone, this);
                this.view.onSearchFailed.connect(this._handleSearchFailed, this);
                this.view.initialize(element);
            }
        },
        _handleSearchDone: {
            value: function (data) {
                this.dispatch("search-done", data);
            }
        },
        _handleSearchFailed: {
            value: function (e) {
                this.dispatch("search-failed", e);
            }
        }
    });
    module.exports = Mediator;
});