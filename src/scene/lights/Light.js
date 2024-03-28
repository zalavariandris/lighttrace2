import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor({Cx, Cy, intensity, wavelength=590}={})
    {
        super({Cx, Cy});
        this.intensity = intensity;
        this.wavelength = wavelength;
    }



    sampleRays()
    {
        return []
    }
}

export {SamplingMethod}
export default Light