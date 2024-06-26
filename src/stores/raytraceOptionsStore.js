const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
});

let raytraceOptions = {
    maxBounce: 9,
    lightSamples: 32,
    samplingMethod: SamplingMethod.Uniform,
    maxSampleSteps: 12000000
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