/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    function ResultsPanelDirectives(model) {
        return {
            restrict: "E",
            link: function ($scope, $element) {
                $scope.model = model;
                $scope.update = function (data) {
                    $scope.$apply(function () {
                        $scope.model.results = data;
                    })
                }
            },
            template:"<ul><li ng-repeat='item in model.results'>{{item}}</li></ul>"
        }
    }

    module.exports = ["model", ResultsPanelDirectives];
});