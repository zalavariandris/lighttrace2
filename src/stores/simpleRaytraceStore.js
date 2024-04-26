
import Shape from "../scene/shapes/Shape.js";
import Light from "../scene/lights/Light.js"
import { raytrace } from "../scene/raytrace.js";

let raytraceResults = {
    rays: [],
    hitPoints: [],
    paths: []
}

let listeners = [];

function emitChange() {
    for (let listener of listeners) {
        listener();
    }
}

export default {
    updateRaytrace(scene, {maxBounce, samplingMethod, lightSamples})
    {
        const lights = Object.values(scene).filter(obj=>obj instanceof Light);
        const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);

        const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shape=>shape.material)], {
            maxBounce: maxBounce, 
            samplingMethod: samplingMethod,
            lightSamples: lightSamples
        });

        raytraceResults = {...raytraceResults,
            lightrays: newRaytraceResults.lightrays,
            hitPoints: newRaytraceResults.hitPoints,
            lightPaths: newRaytraceResults.lightPaths
        };

        emitChange();
    },

    getSnapshot()
    {
        return raytraceResults;
    },

    subscribe(listener) {
        listeners = [...listeners, listener];
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    getSnapshot() {
        return raytraceResults;
    }
}