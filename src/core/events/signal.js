export default function Signal() {

    let slots = [];

    function registrationPossible(listener, once, scope) {

        if (slots.length === 0)return true;
        let existingSlot;
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            if (slot.listener === listener && slot.scope === scope) {
                existingSlot = slot;
                break;
            }
        }

        if (!existingSlot) return true;

        if (existingSlot.once !== once) {
            // If the listener was previously added, definitely don't add it again.
            // But throw an exception if their once values differ.
            throw new Error('You cannot addOnce() then add() the same listener without removing the relationship first.');
        }

        return false; // Listener was already registered.
    }

    function registerListener(listener, once, scope) {
        if (!slots) slots = [];
        if (registrationPossible(listener, once, scope)) {
            const newSlot = {listener, scope, once};
            slots = slots.concat([newSlot]);
        }
        return slots;
    }


    function emit(value) {
        const length = slots.length ||0;
        for (let i = 0; i < length; i++) {
            let {listener, scope, once} = slots[i];
            once && disconnect(listener, scope);
            listener.call(scope, value);
        }

    }


    const connect = (listener, scope) => registerListener(listener, false, scope);

    const connectOnce = (listener, scope) => registerListener(listener, true, scope);

    function disconnect(listener, scope) {
        let filtered = [];
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i];
            if (slot.listener === listener && slot.scope === scope) {
                slot.listener=null;
                slot.scope=null;
                slots[i]=null;
            } else {
                filtered.push(slot);
            }
        }
        slots = filtered;
        return slots;
    }

    function disconnectAll() {
        slots = null;
        return slots;
    }

    return Object.freeze({
        connect,
        connectOnce,
        disconnect,
        disconnectAll,
        emit

    })
}


