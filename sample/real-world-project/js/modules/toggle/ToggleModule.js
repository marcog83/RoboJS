/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $ = require("jquery");

    function ToggleModule(element) {
        this.element = $(element);
        var JQUERY_MODULE = "<div class='results-panel' data-mediator='jquery-results-panel'></div>";
        var ANGULAR_MODULE = '<div class="results-panel" data-mediator="results-panel"><results-panel class="content"></results-panel></div>';
        this.element.on("click", function () {
            this.element.toggleClass("toggled");
            $(".results-panel").remove();
            var element, text;
            if (this.element.hasClass("toggled")) {
                element = JQUERY_MODULE;
                text = 'CHANGE TO ANGULAR MODULE';
            } else {
                element = ANGULAR_MODULE;
                text = 'CHANGE TO JQUERY MODULE';
            }
            this.element.html(text);
            $("body").append(element);
        }.bind(this))
    }

    module.exports = ToggleModule;
});