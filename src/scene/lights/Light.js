import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor({Cx, Cy, intensity, temperature=6500}={})
    {
        super({Cx, Cy});
        this.intensity = intensity;
        this.temperature = temperature;
    }
}

export {SamplingMethod}
export default Light