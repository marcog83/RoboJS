export default function Signal() {

    var listenerBoxes = [];

    function registerListener(listener, scope, once) {

        listenerBoxes
            .filter(box=>(box.listener === listener && box.scope === scope) && (box=>(box.once && !once) || (once && !box.once)))
            .forEach(_=> {
                throw new Error('You cannot addOnce() then try to add() the same listener without removing the relationship first.');
            });
        listenerBoxes = listenerBoxes.concat([{listener, scope, once}]);
    }


    function emit() {
        var args = arguments;
        listenerBoxes.forEach(({listener,scope,once})=> {
            once && disconnect(listener, scope);
            listener.apply(scope, args);
        });
    }


    var connect = (slot, scope) =>registerListener(slot, scope, false);

    var connectOnce = (slot, scope) => registerListener(slot, scope, true);

    function disconnect(slot, _scope) {
        listenerBoxes = listenerBoxes.filter(({listener,scope})=>listener !== slot && scope !== _scope);
    }

    function disconnectAll() {
        listenerBoxes.forEach(({listener,scope})=>disconnect(listener, scope));
    }

    return Object.freeze({
        connect,
        connectOnce,
        disconnect,
        disconnectAll,
        emit

    })
}


