const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
});

let raytraceOptions = {
    maxBounce: 9,
    lightSamples: 7,
    samplingMethod: SamplingMethod.Uniform,
    maxSampleSteps: 1024
};
let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {
    updateOptions(payload) {
        raytraceOptions = {...raytraceOptions, ...payload}
        emitChange();
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return raytraceOptions;
    }
};

export {SamplingMethod};