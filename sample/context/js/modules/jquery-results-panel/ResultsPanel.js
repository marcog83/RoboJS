/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $=require("jquery");
    function ResultsPanel(){

    }
    ResultsPanel.prototype={
        initialize:function(element){
            this.element = $(element);
        },
        update:function(data){
            // Append the results
            this.element.empty();

            $.each(data, function (_, value) {
                $('<li>' + value + '</li>').appendTo(this.element);
            }.bind(this));
        }
    };
    module.exports = ResultsPanel;
});