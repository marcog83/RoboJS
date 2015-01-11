/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $ = require("jquery");

    function SearchPanel(element) {
        this.element = $(element);
        this.input=this.element.find(".search-input");
    }

    SearchPanel.prototype = {
        initialize: function () {

        }
    };
    module.exports = SearchPanel;
});