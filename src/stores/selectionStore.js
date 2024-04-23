let selectionKeys = [];
let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {
    setSelectionKeys(newSelectionKeys) {
        selectionKeys = newSelectionKeys;
        emitChange();
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return selectionKeys;
    }
};