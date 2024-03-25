import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor({x, y, frequency=560}={})
    {
        super({x, y});
        this.frequency = frequency;
    }
    sampleRays()
    {
        return []
    }
}

export {SamplingMethod}
export default Light