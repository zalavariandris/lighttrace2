import Material from "./Material.js"
import {Point, Vector} from "../geo.js"

class TransparentMaterial extends Material
{
    constructor({ior=1.440}={})
    {
        super()
        this.ior = ior
    }

    copy()
    {
        return new TransparentMaterial({ior: this.ior})
    }
}

export default TransparentMaterial;