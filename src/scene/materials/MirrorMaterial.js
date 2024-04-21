import Material from "./Material.js"





class MirrorMaterial extends Material
{
    constructor()
    {
        super()
    }

    copy()
    {
        return new MirrorMaterial()
    }
}

export default MirrorMaterial