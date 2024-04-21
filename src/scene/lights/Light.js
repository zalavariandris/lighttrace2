import SceneObject from "../SceneObject.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    constructor({Cx, Cy, intensity, color=[1,1,1]}={})
    {
        super({Cx, Cy});
        this.intensity = intensity;
        this.color = color;
    }
}

export {SamplingMethod}
export default Light