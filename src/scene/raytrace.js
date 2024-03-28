import {Point, Vector, P, V} from "./geo.js"
import {SamplingMethod} from "./lights/Light.js"

class Lightray
{
    constructor({origin, direction, intensity=0.5, frequency=550}={})
    {
        // console.assert(origin instanceof Point)
        // console.assert(direction instanceof Vector)
        this.origin = origin;
        this.direction = direction;
        this.intensity = intensity;
        this.frequency = frequency;
    }

    copy()
    {
        return new Lightray({
            origin: this.origin, 
            direction: this.direction, 
            intensity: this.intensity, 
            frequency: this.frequency
        });
    }

    toString()
    {
        return `Lightray(${this.origin}, ${this.direction}, ${this.intensity}, ${this.frequency})`
    }
}

class HitPoint
{
     constructor({position, surfaceNormal, shape=null}={})
    {
        this.position = position;
        this.surfaceNormal = surfaceNormal;
        this.shape = shape;
    }

    copy()
    {
        return new HitPoint({
            position: this.position, 
            surfacenormal: this.surfaceNormal, 
            shape: this.shape
        });
    }

    toString(){
        return `HitPoint(${this.position}, ${this.surfaceNormal})`
    }
}

class LightPath{
    constructor({points, intensities, frequency=560})
    {
        this.points = points;
        this.intensities = intensities;
        this.frequency = frequency;
    }

    copy()
    {
        return new LightPath({
            points: this.points.map(P=>P.copy()),
            intensities: this.intensities, 
            frequency: this.frequency
        });
    }

    toString()
    {
        return `Lightpath`
    }
}

class RaytraceResults
{
    constructor(lightrays, hitPoints, lightPaths)
    {
        this.lightrays = lightrays;
        this.hitPoints = hitPoints;
        this.lightPaths = lightPaths;
    }
}



function makeRaysFromLights(lights, {sampleCount, samplingMethod})
{
    // angles to rays
    return lights.map((light)=>{
        return light.sampleRays({sampleCount, samplingMethod});
    }).flat(1);
}

function raytrace_pass(rays, [shapes, materials], {THRESHOLD=1e-6})
{
    // intersection

    const THRESHOLD_SQUARED = THRESHOLD**THRESHOLD
    const hitPoints = rays.map((ray)=>{
        if(ray==null)
        {
            return null;
        }

        const compareDistance = (A,B)=>{
            if(A===null) return B;
            if(B===null) return A;
            return A.position.distanceTo(ray.origin) < B.position.distanceTo(ray.origin) ? A : B;
        }

        const raySceneHitPoints = shapes.map((shape, shapeIdx)=>{
            const hitPoints = shape.hitTest(ray).filter(hitPoint=>hitPoint.position.distanceTo2(ray.origin)>THRESHOLD_SQUARED);
            const closestHitPoint = hitPoints.reduce(compareDistance, null);
            if(closestHitPoint) {closestHitPoint.shapeIdx = shapeIdx;}
            return closestHitPoint;
        })

        // return closest intersection of ray

        return raySceneHitPoints.reduce(compareDistance, null);
    });

    // secondary rays
    const secondaries = hitPoints.map((hitPoint, i)=>{
        if(hitPoint==null)
        {
            return null;
        }
        else
        {
            // shortcuts
            const incidentRay = rays[i];
            const incidentDirection = incidentRay.direction.normalized(1);
            const surfaceNormal = hitPoint.surfaceNormal.normalized(1);

            // calculate hitNormal from surface normal and ray direction. 
            const IsInside = incidentDirection.dotProduct(hitPoint.surfaceNormal)>0;
            const hitNormal = IsInside?surfaceNormal.negate():surfaceNormal;

            // sample material
            const material = materials[hitPoint.shapeIdx]
            const bounceDirection = material.sample(incidentDirection, surfaceNormal);
            const bounceIntensity = incidentRay.intensity*1.0;
            return new Lightray({origin: hitPoint.position, direction: bounceDirection, intensity: bounceIntensity});
        }
    });

    return [secondaries, hitPoints];
}

function raytrace(lights, [shapes, materials], {maxBounce=3, samplingMethod="Uniform", lightSamples=9}={})
{
    // initial rays
    const initialLightrays = makeRaysFromLights(lights, {sampleCount: lightSamples, samplingMethod:samplingMethod});

    // raytrace steps
    let currentRays = initialLightrays;
    const raytraceSteps = [initialLightrays];
    const hitPointSteps = [];
    const lightPaths = initialLightrays.map(r=>new LightPath({points: [r.origin], intensities:[r.intensity], frequency: 560}));
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, hitPoints] = raytrace_pass(currentRays, [shapes, materials], {THRESHOLD:1e-6});
        raytraceSteps.push(secondaries);
        hitPointSteps.push(hitPoints);

        // build paths
        for(let pathIdx=0; pathIdx<lightPaths.length; pathIdx++)
        {
            const hitPoint = hitPoints[pathIdx];
            const lightPath = lightPaths[pathIdx];
            const lightRay = currentRays[pathIdx];
            if(hitPoint && lightRay)
            {
                lightPath.points.push(hitPoint.position);
                lightPath.intensities.push(lightRay.intensity)
            }
            else if(lightRay)
            {
                lightPath.points.push(P(lightRay.origin.x+lightRay.direction.x*1000, lightRay.origin.y+lightRay.direction.y*1000));
                lightPath.intensities.push(lightRay.intensity)
            }
            else
            {

            }
        }

        // allRays = [...allRays, ...secondaries]
        // allHitPoints = [...allHitPoints, ...hitPoints]
        currentRays = secondaries;
    }

    const allRays = raytraceSteps.flat(1);
    const allHitPoints = hitPointSteps.flat(1);
    return new RaytraceResults(
        allRays.filter(lightRay=>lightRay?true:false), 
        allHitPoints.filter(hitPoint=>hitPoint?true:false),
        lightPaths
    )
}

export {makeRaysFromLights, raytrace, SamplingMethod}
export {Lightray, HitPoint}