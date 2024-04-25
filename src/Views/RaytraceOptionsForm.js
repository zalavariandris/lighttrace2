import React, {useSyncExternalStore} from "react";
import raytraceOptionsStore, {SamplingMethod} from "../stores/raytraceOptionsStore.js";
import { raytrace } from "../scene/raytrace.js";
const h = React.createElement;


function animate()
{
    requestAnimationFrame(animate);
    // progressive raytrace
}

animate()


function RaytraceOptionsForm()
{
    const raytraceOptions = useSyncExternalStore(raytraceOptionsStore.subscribe, raytraceOptionsStore.getSnapshot);
    return h("form", null,
        // h("label", null, `Sampling steps: ${currentSampleStep}`,
        //     "/",
        //     h("input", {
        //         type: "number", 
        //         value: raytraceOptions.maxSampleSteps,
        //         onChange:e=>raytraceOptionsStore.updateOptions({maxSampleSteps: e.target.value})
        //     }),
        //     h("progress", {value: currentSampleStep, max:raytraceOptions.maxSampleSteps}),
        // ),

        h("label", null, "Light samples",
            h("input", {
                type:"range", 
                name: "light samples",
                value:raytraceOptions.lightSamples, 
                onInput:(e)=>raytraceOptionsStore.updateOptions({lightSamples: e.target.value}),
                min: 1, 
                max: 512
            }),
            `${raytraceOptions.lightSamples}`
        ),
        h("label", null, "Max bounce",
            h("input", {
                type:"range", 
                name: "max bounce",
                value:raytraceOptions.maxBounce, 
                onInput:(e)=>raytraceOptionsStore.updateOptions({maxBounce: e.target.value}), 
                min: 0, 
                max:16
            }),
            `${raytraceOptions.maxBounce}`
        ),
        h("label", null, "Sampling method",
            h("label", null, 
                SamplingMethod.Random,
                h("input", {
                    name: "sampling", 
                    checked: raytraceOptions.samplingMethod == SamplingMethod.Random,
                    onChange: (e)=>raytraceOptionsStore.updateOptions({samplingMethod: e.target.value}),
                    id:SamplingMethod.Random, 
                    type:"radio", 
                    value:SamplingMethod.Random
                })
            ),
            h("label", null, 
                SamplingMethod.Uniform,
                h("input", {
                    name: "sampling",
                    checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                    onChange: (e)=>raytraceOptionsStore.updateOptions({samplingMethod: e.target.value}),
                    id: SamplingMethod.Uniform,
                    type:"radio",
                    value:SamplingMethod.Uniform
                })
            )
        )
    );
}

export default RaytraceOptionsForm;