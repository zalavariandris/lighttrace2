import SceneObject from "../SceneObject.js";

class Shape extends SceneObject
{
    constructor({Cx, Cy, material})
    {
        super({Cx, Cy})
        this.material = material;
    }
}

export default Shape