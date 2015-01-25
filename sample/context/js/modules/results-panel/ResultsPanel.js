/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $ = require("jquery");
    var angular = require("angular");
    var Model = require("./ng/Model");
    var ResultsPanelDirectives = require("./ng/ResultsPanelDirectives");

    function ResultsPanel() {

    }

    ResultsPanel.prototype = {
        initialize: function (element) {
            this.element = $(element);
            var module = angular.module("ResultsPanel", []);
            module.provider("model", {
                model: new Model(),
                $get: [function () {
                    return this.model; //resolved for the lifetime of app
                }
                ]
            });
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