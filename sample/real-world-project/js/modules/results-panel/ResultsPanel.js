/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $ = require("jquery");
    var angular = require("angular");
    var ModelProvider = require("./ng/ModelProvider");
    var ResultsPanelDirectives = require("./ng/ResultsPanelDirectives");

    function ResultsPanel(element) {
        this.element = $(element);
    }

    ResultsPanel.prototype = {
        initialize: function () {
            var module = angular.module("ResultsPanel", []);
            module.provider("model", ModelProvider);
            module.directive("resultsPanel", ResultsPanelDirectives);
            angular.bootstrap(this.element, ["ResultsPanel"]);
        },
        update: function (data) {
            this.element.find(".content").scope().update(data);
        },
        destroy: function () {
            // dispose angular application in some way ! actually i don't know how to do ;)
            //this.element.find(".content").scope().$destroy();
        }
    };
    module.exports = ResultsPanel;
});