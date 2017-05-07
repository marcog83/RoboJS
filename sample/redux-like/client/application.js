/**
 * Created by marco.gobbi on 18/12/2014.
 */
define(function (require) {
    "use strict";
    var rjs = require("robojs");
    var definitions = {
        "todo-app": "client/todo-app"
        ,"todo-add": "client/todo-add"
        ,"todo-list": "client/todo-list"
        ,"todo-thumb": "client/todo-thumb"
        ,"todo-filter": "client/todo-filter"

    };


    return function () {
        rjs.bootstrap({
            definitions: definitions
        }).promise.catch(function (e) {
            console.log(e);
        });

    };
});