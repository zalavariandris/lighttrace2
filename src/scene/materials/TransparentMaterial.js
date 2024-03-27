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

function calculateRefraction(V, N, refractiveIndex1=1.0, refractiveIndex2=1.44)
{
    V = V.normalized();
    N = N.normalized();
    var cosI = V.dotProduct(N);
    var refractiveIndexRatio = refractiveIndex1 / refractiveIndex2;

    var exitVectorX, exitVectorY;

    if (cosI < 0) {
        // Ray is entering the water
        var sinT2 = refractiveIndexRatio * refractiveIndexRatio * (1.0 - cosI * cosI);
        if (sinT2 > 1.0) {
            // Total internal reflection
            exitVectorX = -V.x;
            exitVectorY = -V.y;
        } else {
            var cosT = Math.sqrt(1.0 - sinT2);
            exitVectorX = refractiveIndexRatio * V.x + (refractiveIndexRatio * cosI - cosT) * N.x;
            exitVectorY = refractiveIndexRatio * V.y + (refractiveIndexRatio * cosI - cosT) * N.y;
        }
    } else {
        // Ray is exiting the water
        var sinT2 = refractiveIndexRatio * refractiveIndexRatio * (1.0 - cosI * cosI);
        if (sinT2 > 1.0) {
            // Total internal reflection
            exitVectorX = -V.x;
            exitVectorY = -V.y;
        } else {
            var cosT = Math.sqrt(1.0 - sinT2);
            exitVectorX = refractiveIndexRatio * V.x + (refractiveIndexRatio * cosI - cosT) * N.x;
            exitVectorY = refractiveIndexRatio * V.y + (refractiveIndexRatio * cosI - cosT) * N.y;
        }
    }

    return new Vector(exitVectorX, exitVectorY);
}



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