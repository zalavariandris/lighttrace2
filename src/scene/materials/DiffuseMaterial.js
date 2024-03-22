import Material from "./Material.js"

function sampleDiffuse(V, N)
{
    const spread = 1/1;
    const angle = Math.random()*Math.PI*spread-Math.PI*spread/2 + Math.atan2(N.y, N.x);
    
    return new Vector(Math.cos(angle), Math.sin(angle));
}

class DiffuseMaterial extends Material
{
    constructor()
    {
        super()
    }

    copy(){
        return new DiffuseMaterial();
    }

    sample(V, N)
    {
        return sampleDiffuse(V, N)
    }
}

export default DiffuseMaterial;