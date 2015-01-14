/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var $ = require("jquery");
    var RoboJS = require("RoboJS");
    var Rx = require("rx");

    function SearchPanel(element) {
        this.element = $(element);
        this.input = this.element.find(".search-input");
        this.onSearchDone = new RoboJS.events.Signal();
        this.onSearchFailed = new RoboJS.events.Signal();
    }

    SearchPanel.prototype = {
        searchWikipedia: function (term) {
            return $.ajax({
                url: 'http://en.wikipedia.org/w/api.php',
                dataType: 'jsonp',
                data: {
                    action: 'opensearch',
                    format: 'json',
                    search: window.encodeURI(term)
                }
            }).promise();
        },
        initialize: function () {
            // Get all distinct key up events from the input and only fire if long enough and distinct
            var keyup = Rx.Observable.fromEvent(this.input, 'keyup')
                .map(function (e) {
                    return e.target.value; // Project the text from the input
                })
                .filter(function (text) {
                    return text.length > 2; // Only if the text is longer than 2 characters
                })
                .throttle(750 /* Pause for 750ms */)
                .distinctUntilChanged(); // Only if the value has changed

            var searcher = keyup.flatMapLatest(this.searchWikipedia);

            searcher.subscribe(this._handleSearchDone.bind(this), this._handleSearchFailed.bind(this));
        },
        _handleSearchDone: function (data) {
            var res = data[1];
            this.onSearchDone.emit(res);
        },
        _handleSearchFailed: function (error) {
            this.onSearchFailed.emit([error]);
        }
    };

    module.exports = SearchPanel;
});
