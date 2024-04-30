import {Point, Vector, P, V} from "../scene/geo.js"
import { SamplingMethod } from "../stores/raytraceOptionsStore.js";
import _ from "lodash"
import { sampleBlackbody } from "../UI/BlackBody.js";

import LineSegment from "../scene/shapes/LineSegment.js";
import {hitShape, HitPoint} from "./hitTests.js"
import Lightray from "./LightRay.js";
import { sampleLight } from "./samplelights.js";
import {sampleMaterial} from "./sampleMaterials.js"
const EPSILON=1e-6;



class LightPath{
    constructor(rays=[])
    {
        this.rays = rays;
    }

    copy()
    {
        return new LightPath(this.rays.map(r=>r.copy()));
    }

    toString()
    {
        return `Lightpath`
    }
}

class RaytraceResults
{
    constructor(lightRays, hitPoints, lightPaths)
    {
        this.lightRays = lightRays;
        this.hitPoints = hitPoints;
        this.lightPaths = lightPaths;
    }
}

function raytracePass(rays, [shapes, materials], {THRESHOLD=1e-6}={})
{
    // intersection Threshold
    const THRESHOLD_SQUARED = THRESHOLD**THRESHOLD;

    // I. Calculate hitData for each ray

    const hitPoints = rays.map((ray)=>{
        if(ray==null)
        {
            return [null, null, null];
        }

        const raySceneHitPoints = _.zip(shapes, materials).map(([shape, material])=>{
            let hitPoint = hitShape(ray, shape, {DISTANCE_THRESHOLD: THRESHOLD})
            return [hitPoint, shape, material];
        });

        // reduce hitData for each ray to the closest hitPoint
        return raySceneHitPoints.reduce(([hitPointA, shapeA, materialA],[hitPointB, shapeB, materialB])=>{
            if(hitPointA===null) return [hitPointB, shapeB, materialB];
            if(hitPointB===null) return [hitPointA, shapeA, materialA];
            return hitPointA.position.distanceTo(ray.origin) < hitPointB.position.distanceTo(ray.origin) ? [hitPointA, shapeA, materialA]: [hitPointB,shapeB, materialB];
        }, [null, null, null]);
    });

    // II. Generate secondary rays from hitData
    const secondaries = hitPoints.map(([hitPoint, shape, material], i)=>{
        if(hitPoint==null)
        {
            return null;
        }
        else
        {
            // shortcuts
            const incidentRay = rays[i];
            return sampleMaterial(material, incidentRay, hitPoint);
        }
    });

    return [secondaries, hitPoints.map(hitData=>hitData[0])];
}

function raytrace(lights, [shapes, materials], {maxBounce=3, samplingMethod="Uniform", lightSamples=9}={})
{
    // initial rays
    const initialLightrays = lights.map((light)=>{
        return sampleLight(light, {sampleCount:lightSamples, samplingMethod});
    }).flat(1);

    // raytrace steps
    let currentRays = initialLightrays;
    const raytraceSteps = [initialLightrays];
    const hitPointSteps = [];
    const lightPaths = initialLightrays.map(r=>new LightPath([r]));
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, hitPoints] = raytracePass(currentRays, [shapes, materials], {THRESHOLD:1e-6});
        raytraceSteps.push(secondaries);
        hitPointSteps.push(hitPoints);

        // build paths
        for(let pathIdx=0; pathIdx<lightPaths.length; pathIdx++)
        {
            const hitPoint = hitPoints[pathIdx];
            const lightPath = lightPaths[pathIdx];
            const lightRay = currentRays[pathIdx];
            if(lightRay)
            {
                lightPath.rays.push(lightRay);
            }
        }

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

export {raytrace, SamplingMethod}
export {raytracePass}
export {sampleLight}
export {Lightray, HitPoint}