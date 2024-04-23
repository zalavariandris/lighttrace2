import SceneObject from "../SceneObject.js"



class Light extends SceneObject
{
    constructor({Cx, Cy, intensity, temperature=6500}={})
    {
        super({Cx, Cy});
        this.intensity = intensity;
        this.temperature = temperature;
    }
}

export default Light