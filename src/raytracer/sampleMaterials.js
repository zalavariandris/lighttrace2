import Lightray from "./LightRay.js";
import {Vector, Point, P, V} from "../scene/geo.js"

function sellmeierIor(b, c, lambda)
{
    // Calculate the square of the wavelength
    const lSq = (lambda * 1e-3) * (lambda * 1e-3);

    // Calculate the contribution of each Sellmeier term and sum them up
    let sum = 0;
    for (let i = 0; i < b.length; i++) {
        sum += (b[i] * lSq) / (lSq - c[i]);
    }

    // Add 1.0 to the sum to get the refractive index squared
    return 1.0 + sum;
}

function sampleTransparent(incidentRay, hitPoint, ior)
{
    const V = incidentRay.direction.normalized();
    const N = hitPoint.surfaceNormal.normalized();

    let cosI = -V.dotProduct(N); // Corrected to ensure cosI is always positive
    
    let refractiveIndexRatio = cosI < 0 ? ior : 1.0 / ior; // Adjust ratio based on entering or exiting

    // Corrected to flip the normal vector when exiting
    const normal = cosI < 0 ? N.negate() : N;
    cosI = Math.abs(cosI); // cosI should be positive after adjustment

    let sinT2 = refractiveIndexRatio * refractiveIndexRatio * (1.0 - cosI * cosI);
    if (sinT2 > 1.0) {
        // angle is greater the the critical angle.
        // Total internal reflection
        return new Lightray({
            origin: hitPoint.position,
            direction: V.reflect(normal), // Reflect method calculates the reflection vector
            intensity: incidentRay.intensity,
            wavelength: incidentRay.wavelength
        });
    } else {
        let cosT = Math.sqrt(1.0 - sinT2);
        // Corrected formula for exit vector
        let exitVector = V.multiply(refractiveIndexRatio).add(normal.multiply(refractiveIndexRatio * cosI - cosT));
        return new Lightray({
            origin: hitPoint.position,
            direction: exitVector,
            intensity: incidentRay.intensity,
            wavelength: incidentRay.wavelength
        });
    }
}

function sampleMirror(incidentRay, hitPoint)
{
    const V = incidentRay.direction;
    const N = hitPoint.surfaceNormal;
    return new Lightray({
        origin: hitPoint.position,
        direction: V.reflect(N),
        intensity: incidentRay.intensity,
        wavelength: incidentRay.wavelength
    });
}

function sampleDiffuse(incidentRay, hitPoint)
{
    const V = incidentRay.direction.normalized();
    let N = hitPoint.surfaceNormal.normalized();
    const HitFromOutside = V.dotProduct(N)>0.0;
    if(HitFromOutside){
        N = N.negate();
    }
    
    const spread = 1/1;
    const angle = Math.random()*Math.PI*spread-Math.PI*spread/2 + Math.atan2(N.y, N.x);

    return new Lightray({
        origin: hitPoint.position,
        direction: new Vector(Math.cos(angle), Math.sin(angle)),
        intensity: incidentRay.intensity,
        wavelength: incidentRay.wavelength
    });
}

function sampleMaterial(material, incidentRay, hitPoint)
{
    switch (material) {
        case "glass":
            const b = [1.6215, 0.2563, 1.6445];
            const c = [0.0122, 0.0596, 147.4688];
            let ior =  sellmeierIor(b, c, incidentRay.wavelength)/1.44;
            // const ior = Math.sqrt(iorSquared)
            return sampleTransparent(incidentRay, hitPoint, ior);
        case "mirror":
            return sampleMirror(incidentRay, hitPoint);

        case "diffuse":
            return sampleDiffuse(incidentRay, hitPoint);
        default:
            return incidentRay;
    }
}

export {sampleMaterial};