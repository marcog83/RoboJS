/**
 * Created by mgobbi on 12/12/2016.
 */
define(function (require) {

    return function (node, dispatcher) {
        var visibilityFilters = {
            SHOW_ALL: function () {
                return true;
            }
            , SHOW_COMPLETED: function (todo) {
                return todo.completed;
            }
            , SHOW_ACTIVE: function (todo) {
                return !todo.completed;
            }

        };
        dispatcher.addEventListener("state", function (e) {
            var state = e.detail;
            var filterFn = visibilityFilters[state.visibilityFilter];
            node.innerHTML = state.todos
                .reduce(function (prev, todo, i) {
                    if (!filterFn(todo))return prev;
                    return prev.concat(`<li data-mediator="todo-thumb" data-index="${i}" class="${todo.completed ? 'completed' : ''}"><a href="#">${todo.text}</a></li>`)
                }, "<ul>").concat("</ul>")
        })
    };
});