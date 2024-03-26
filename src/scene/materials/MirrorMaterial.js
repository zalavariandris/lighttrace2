import Material from "./Material.js"
import {Point, Vector} from "../../geo.js"


function sampleMirror(V, N)
{
    return V.subtract(N.multiply(2*V.dotProduct(N)));
}

class MirrorMaterial extends Material
{
    constructor(key)
    {
        super(key)
    }

    copy()
    {
        return new MirrorMaterial(this.key)
    }

    sample(V, N)
    {
        return sampleMirror(V, N)
    }
}

export default MirrorMaterial