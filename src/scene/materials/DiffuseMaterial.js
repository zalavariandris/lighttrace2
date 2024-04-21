import Material from "./Material.js"


class DiffuseMaterial extends Material
{
    constructor()
    {
        super()
    }

    copy(){
        return new DiffuseMaterial();
    }
}

export default DiffuseMaterial;