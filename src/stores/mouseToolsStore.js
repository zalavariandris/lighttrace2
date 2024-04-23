

let currentMouseTool = null;


const mouseTools = ["circle",
"rectangle",
"line",
"lens",
"pointlight",
"directional",
"laser"]


let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {
    setCurrentTool(toolname) {
        currentMouseTool = toolname
        emitChange();
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return currentMouseTool;
    }
};

export {mouseTools};