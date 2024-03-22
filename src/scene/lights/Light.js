import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    sampleRays()
    {
        return []
    }
}

export {SamplingMethod}
export default Light