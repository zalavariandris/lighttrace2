import {Point, Vector, P, V} from "./geo.js"
import {Ray} from "./geo.js"
import {Circle, LineSegment, Rectangle} from "./scene.js"
import {Light, PointLight, LaserLight} from "./scene.js"
import {SamplingMethod} from "./scene.js"

const Side = Object.freeze({
    Outside: "Outside",
    Inside: "Inside"
})

class HitPoint{
    constructor(position, surfaceNormal, shape=null, side=Side.Outside)
    {
        console.assert(position instanceof Point, "got:", position)
        console.assert(surfaceNormal instanceof Vector, "got:", surfaceNormal)
        this.position = position;
        this.surfaceNormal = surfaceNormal;
        this.shape = shape;
        this.side = side;
    }

    copy()
    {
        return new HitPoint(this.position, this.surfaceNormal, this.shape, this.side);
    }

    toString(){
        return `HitPoint(${this.position}, ${this.surfaceNormal})`
    }
}

class Lightray{
    constructor(origin, direction, ior=1.0, wavelength=550)
    {
        console.assert(origin instanceof Point)
        console.assert(direction instanceof Vector)
        this.origin = origin;
        this.direction = direction;
        this.ior = ior;
        this.wavelength = wavelength;
    }

    copy()
    {
        return new Lightray(this.origin, this.direction, this.ior, this.wavelength);
    }

    toString(){
        return `Lightray(${this.origin}, ${this.direction})`
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
            return A.position.distanceTo(ray.origin) < A.position.distanceTo(ray.origin) ? A : B;
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
            const ray = rays[i];
            const material = materials[hitPoint.shapeIdx]
            const bounceDirection = material.sample(ray.direction.normalized(1), hitPoint.surfaceNormal.normalized(1), ray.ior || 1.0);
            const lightray = new Lightray(hitPoint.position, bounceDirection);
            return lightray
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
    const lightPaths = initialLightrays.map(r=>[r.origin]);
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, hitPoints] = raytrace_pass(currentRays, [shapes, materials], {THRESHOLD:1e-6});
        raytraceSteps.push(secondaries);
        hitPointSteps.push(hitPoints);

        // build paths
        for(let pathIdx=0; pathIdx<lightPaths.length; pathIdx++)
        {
            if(hitPoints[pathIdx])
            {
                lightPaths[pathIdx].push(hitPoints[pathIdx].position);
            }
            else if(currentRays[pathIdx])
            {
                const ray = currentRays[pathIdx];
                lightPaths[pathIdx].push(P(ray.origin.x+ray.direction.x*1000, ray.origin.y+ray.direction.y*1000));
            }
        }

        // allRays = [...allRays, ...secondaries]
        // allHitPoints = [...allHitPoints, ...hitPoints]
        currentRays = secondaries;
    }

    const allRays = raytraceSteps.flat(1);
    const allHitPoints = hitPointSteps.flat(1);
    return [
        allRays.filter(lightRay=>lightRay?true:false), 
        allHitPoints.filter(hitPoint=>hitPoint?true:false),
        lightPaths
    ]
}

export {makeRaysFromLights, raytrace, SamplingMethod}
export {Lightray, HitPoint}