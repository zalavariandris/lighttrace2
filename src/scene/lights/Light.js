import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor(key, {x, y, wavelength=590}={})
    {
        super(key, {x, y});
        this.wavelength = wavelength;
    }



    sampleRays()
    {
        return []
    }
}

export {SamplingMethod}
export default Light