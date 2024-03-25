import SceneObject from "../SceneObject.js";

class Shape extends SceneObject
{
    constructor(key, {x, y, material})
    {
        super(key, {x, y})
        this.material = material;
    }

    hitTest()
    {
        return []
    }
}

export default Shape