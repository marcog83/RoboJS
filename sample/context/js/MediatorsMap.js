/**
 * Created by marco.gobbi on 09/12/2014.
 */
define(function (require) {
    "use strict";
    return [
        {
            "id": "search-panel",
            "mediator": "modules/search-panel/Mediator",
            "dependencies": ["modules/search-panel/SearchPanel"]
        },
        {
            "id": "results-panel",
            "mediator": "modules/results-panel/Mediator",
            "dependencies": ["modules/results-panel/ResultsPanel"]
        },
        {
            "id": "jquery-results-panel",
            "mediator": "modules/results-panel/Mediator",
            "dependencies": ["modules/jquery-results-panel/ResultsPanel"]
        },
        {
            "id": "toggle",
            "mediator": "modules/toggle/ToggleModule"
        }
    ];
});