import SceneObject from "../SceneObject.js";

class Shape extends SceneObject
{
    constructor({x, y, material})
    {
        super({x, y})
        this.material = material;
    }

    hitTest()
    {
        return []
    }
}

export default Shape