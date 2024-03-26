import Material from "./Material.js"
import {Point, Vector} from "../../geo.js"

function sampleTransparent(V, N, ior=1.440)
{
    var c = - N.dotProduct(V);
    const IsOutside = c>0;
    if(IsOutside)/* collide from outside*/
    {
        const dotProduct = V.dotProduct(N);
        const angleOfIncidence = Math.acos(dotProduct);


        var angleOfRefraction = Math.asin((n1 / n2) * Math.sin(angleInRadians));
        const incidenceAngle = Math.asin(N.dotProduct(V))
        const exitAngle = incidenceAngle;

        return new Vector(Math.cos(exitAngle+Math.PI/2), Math.sin(exitAngle+Math.PI/2))
        // Ex

        // var r  = 1/ior;
        // return V.multiply(r).add( N.multiply(r*c - Math.sqrt( 1-Math.pow(r,2) * (1-Math.pow(c,2) )  )) );
    }
    else /* collide from inside*/
    {
        var r  = 1/ior;
        // return new Vector(0,1);
        return V.multiply(r).add( N.multiply(r*c - Math.sqrt( 1-Math.pow(r,2) * (1-Math.pow(c,2) )  )) ).multiply(-1);
    }
}

function calculateRefraction(V, N, refractiveIndex1=1.0, refractiveIndex2=1.440) {
    // Calculate the angle of incidence
    var dotProduct = V.x * N.x + V.y * N.y;

    // if(dotProduct<0){
    //     [refractiveIndex2, refractiveIndex1] = [refractiveIndex1, refractiveIndex2];
    // } this seems unnecessart with this approach

    var cosTheta = dotProduct;
    var angleOfIncidence = Math.acos(cosTheta);

    // Calculate the angle of refraction using Snell's Law
    var angleOfRefraction = Math.asin((refractiveIndex1 / refractiveIndex2) * Math.sin(angleOfIncidence));

    // Calculate the exit vector components
    var exitVectorX = refractiveIndex1 / refractiveIndex2 * V.x + 
                      (refractiveIndex1 / refractiveIndex2 * Math.cos(angleOfIncidence) - Math.cos(angleOfRefraction)) * N.x;
    var exitVectorY = refractiveIndex1 / refractiveIndex2 * V.y + 
                      (refractiveIndex1 / refractiveIndex2 * Math.cos(angleOfIncidence) - Math.cos(angleOfRefraction)) * N.y;

    // Return the exit vector
    return new Vector(exitVectorX, exitVectorY);
}



class TransparentMaterial extends Material
{
    constructor(key, {ior=1.440}={})
    {
        super(key)
        this.ior = ior
    }

    copy()
    {
        return new TransparentMaterial(key, {ior: this.ior})
    }

    sample(V, N)
    {
        /*
        V: ray direction
        N: surface normal (faceing outwards!)
        */
        return calculateRefraction(V, N);
        return sampleTransparent(V, N, this.ior)
    }
}

export default TransparentMaterial;