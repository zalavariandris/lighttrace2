let displayOptions = {
    lightrays: false,
    hitpoints: false,
    lightpaths: false,
    glPaint: true
};
let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {
    updateVisibility(payload) {
        displayOptions = {...displayOptions, ...payload}
        emitChange();
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return displayOptions;
    }
};