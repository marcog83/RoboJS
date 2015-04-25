export default function Signal() {

    let listenerBoxes = [];

    function registerListener(listener, scope, once) {
        for (let i = 0; i < listenerBoxes.length; i++) {
            if (listenerBoxes[i].listener == listener && listenerBoxes[i].scope == scope) {
                if (listenerBoxes[i].once && !once) {
                    throw new Error('You cannot addOnce() then try to add() the same listener ' +
                    'without removing the relationship first.');
                }
                else if (once && !listenerBoxes[i].once) {
                    throw new Error('You cannot add() then addOnce() the same listener ' +
                    'without removing the relationship first.');
                }
                return;
            }
        }


        listenerBoxes.push({listener, scope, once});
    }


    function emit() {



        // var listenerBoxes = listenerBoxes;
        let len = listenerBoxes.length;
        let listenerBox;


        for (let i = 0; i < len; i++) {
            listenerBox = listenerBoxes[i];
            if (listenerBox.once)
                disconnect(listenerBox.listener, listenerBox.scope);

            listenerBox.listener.apply(listenerBox.scope, arguments);
        }

    }


    let connect = (slot, scope) =>registerListener(slot, scope, false);

    let connectOnce = (slot, scope) => registerListener(slot, scope, true);

    function disconnect(slot, scope) {


        for (let i = listenerBoxes.length; i--;) {
            if (listenerBoxes[i].listener == slot && listenerBoxes[i].scope == scope) {
                listenerBoxes.splice(i, 1);
                return;
            }
        }
    }

    function disconnectAll() {

        for (var i = listenerBoxes.length; i--;) {
            disconnect(listenerBoxes[i].listener, listenerBoxes[i].scope);
        }
    }

    return {
        connect,
        connectOnce,
        disconnect,
        disconnectAll,
        emit

    }
}


