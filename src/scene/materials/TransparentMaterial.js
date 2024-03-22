import Material from "./Material.js"
import {Point, Vector} from "../../geo.js"

function sampleTransparent(V, N, ior=1.440)
{
    var c = - N.dotProduct(V);
    const IsOutside = c>0;
    if(IsOutside)/* collide from outside*/
    {
        var r  = 1/ior;
        return V.multiply(r).add( N.multiply(r*c - Math.sqrt( 1-Math.pow(r,2) * (1-Math.pow(c,2) )  )) );
    }
    else /* collide from inside*/
    {
        var r  = ior/1;
        return V.multiply(r).add( N.multiply(r*c + Math.sqrt( 1-Math.pow(r,2) * (1-Math.pow(c,2) )  )) );
    }
}

class TransparentMaterial extends Material
{
    constructor()
    {
        super()
    }

    copy()
    {
        return new TransparentMaterial()
    }

    sample(V, N)
    {
        /*
        V: ray direction
        N: surface normal (faceing outwards!)
        */
        return sampleTransparent(V, N)
    }
}

export default TransparentMaterial;