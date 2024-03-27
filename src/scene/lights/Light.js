import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor({x, y, wavelength=590}={})
    {
        super({x, y});
        this.wavelength = wavelength;
    }



    sampleRays()
    {
        return []
    }
}

export {SamplingMethod}
export default Light