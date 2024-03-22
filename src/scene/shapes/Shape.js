import SceneObject from "../SceneObject.js";

class Shape extends SceneObject
{
    constructor(center, material)
    {
        super(center)
        this.material = material;
    }

    hitTest()
    {
        return null
    }
}

export default Shape