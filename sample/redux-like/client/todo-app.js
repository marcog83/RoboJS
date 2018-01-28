/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {
    var Actions = require("./actions");
    return function (node, dispatcher) {
        var state = {
            visibilityFilter: 'SHOW_ALL',
            todos: []
        };
        dispatcher.addEventListener(Actions.ADD_TODO, function (e) {
            var text = e.detail;
            state = Object.assign({}, state, {
                todos: [ {
                    text: text,
                    completed: false
                }].concat(state.todos)
            });
            dispatcher.dispatchEvent(new CustomEvent("state", {detail:state}));
        });
        dispatcher.addEventListener(Actions.SET_VISIBILITY_FILTER, function (e) {
            var visibilityFilter = e.detail;
            state = Object.assign({}, state, {
                visibilityFilter: visibilityFilter
            });
            dispatcher.dispatchEvent(new CustomEvent("state", {detail:state}));
        });
        dispatcher.addEventListener(Actions.TOGGLE_TODO, function (e) {
            var toggleIndex = e.detail;
            state = Object.assign({}, state, {
                todos: state.todos.map((todo, index) => {
                    if (index === toggleIndex) {
                        return Object.assign({}, todo, {
                            completed: !todo.completed
                        })
                    }
                    return todo
                })
            });
            dispatcher.dispatchEvent(new CustomEvent("state", {detail:state}));
        })

    };
});