/**
 * Created by marco on 11/01/2015.
 */
define(function (require, exports, module) {
    'use strict';
    var Model = require("./Model");
    var ModelProvider = {
        model: new Model(),
        $get: [function () {
                return this.model; //resolved for the lifetime of app
            }
        ]
    };
    module.exports = ModelProvider;
});