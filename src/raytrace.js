import {Point, Vector, Ray, P, V} from "./geo.js"
import {Circle, LineSegment, Rectangle} from "./scene.js"
import {Light, PointLight, LaserLight} from "./scene.js"
import {SamplingMethod} from "./scene.js"



function makeRaysFromLights(lights, {sampleCount, samplingMethod})
{
    // angles to rays
    return lights.map((light)=>{
        return light.sampleRays({sampleCount, samplingMethod});
    }).flat(1);
}

// function intersect(rays, shapes, {THRESHOLD=1.0}={})
// {
//     /*
//     find each ray closest intersection with scene
//     rays: Array[Ray | null]
//     shapes: Array[Circle | Rectangle | LineSegment]
//     returns Array[Ray | null]
//     */

//     return rays.map((ray)=>{
//         if(ray==null)
//         {
//             return null;
//         }

//         const shape_intersections = shapes.map((shape)=>{
//             return shape.hitTest(ray)
//         }).flat(1).filter(intersection=>{
//             return ray.origin.distanceTo(intersection.origin)>THRESHOLD;
//         });

//         // return closest intersection of ray
//         return shape_intersections.reduce((a,b)=>{
//             if(a===null) return b;
//             if(b===null) return a;
//             return ray.origin.distanceTo(a.origin) < ray.origin.distanceTo(b.origin) ? a : b;
//         }, null);
//     });
// }

function rayClosestToPoint(point)
{
    return (a,b)=>{
        if(a===null) return b;
        if(b===null) return a;
        return a.origin.distanceTo(point) < b.origin.distanceTo(point) ? a : b;
    };
}

function raytrace_pass(rays, [shapes, materials], {THRESHOLD=1e-6})
{
    // intersection

    const THRESHOLD_SQUARED = THRESHOLD**THRESHOLD
    const intersections = rays.map((ray)=>{
        if(ray==null)
        {
            return null;
        }

        const shape_intersections = shapes.map((shape, shapeIdx)=>{
            const intersections = shape.hitTest(ray).filter(intersection=>ray.origin.distanceTo2(intersection.origin)>THRESHOLD_SQUARED);
            return intersections;
        }).flat(1);

        // return closest intersection of ray
        return shape_intersections.reduce((a,b)=>{
            if(a===null) return b;
            if(b===null) return a;
            return ray.origin.distanceTo(a.origin) < ray.origin.distanceTo(b.origin) ? a : b;
        }, null);
    });

    // secondary rays
    const secondaries = intersections.map((intersection, i)=>{
        if(intersection==null)
        {
            return null;
        }
        else
        {
            const ray = rays[i];
            const secondary_direction = sampleMirror(ray.direction.normalized(1), intersection.direction.normalized(1));
            return new Ray(intersection.origin, secondary_direction);
        }
    });

    return [secondaries, intersections];
}

function raytrace_pass2(rays, [shapes, materials], {THRESHOLD=1e-6})
{
    // intersection

    const THRESHOLD_SQUARED = THRESHOLD**THRESHOLD
    const intersections = rays.map((ray)=>{

        const compare_distance = (a,b)=>{
            if(a===null) return b;
            if(b===null) return a;
            return ray.origin.distanceTo(a.origin) < ray.origin.distanceTo(b.origin) ? a : b;
        }

        if(ray==null)
        {
            return null;
        }

        const shape_intersection = shapes.map((shape, shapeIdx)=>{
            const intersections = shape.hitTest(ray).filter(intersection=>ray.origin.distanceTo2(intersection.origin)>THRESHOLD_SQUARED);
            const closest_intersection = intersections.reduce(compare_distance, null);
            if(closest_intersection) {closest_intersection.shapeIdx = shapeIdx;}
            return closest_intersection;
        })

        // return closest intersection of ray
        return shape_intersection.reduce(compare_distance, null);
    });

    // secondary rays
    const secondaries = intersections.map((intersection, i)=>{
        if(intersection==null)
        {
            return null;
        }
        else
        {
            const ray = rays[i];
            const material = materials[intersection.shapeIdx]
            const secondary_direction = material.sample(ray.direction.normalized(1), intersection.direction.normalized(1));
            return new Ray(intersection.origin, secondary_direction);
        }
    });

    return [secondaries, intersections];
}

function raytrace(lights, [shapes, materials], {maxBounce=3, samplingMethod="Uniform", lightSamples=9}={})
{
    // initial rays
    const initial_rays = makeRaysFromLights(lights, {sampleCount: lightSamples, samplingMethod:samplingMethod});

    // raytrace steps
    let currentRays = initial_rays;
    const ray_steps = [initial_rays];
    const intersections_steps = [];
    const paths = initial_rays.map(r=>[r.origin]);
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, intersections] = raytrace_pass2(currentRays, [shapes, materials], {THRESHOLD:1e-6});
        ray_steps.push(secondaries);
        intersections_steps.push(intersections);

        // build paths
        for(let p=0; p<paths.length; p++)
        {
            if(intersections[p])
            {
                paths[p].push(intersections[p].origin);
            }
            else if(currentRays[p])
            {
                const ray = currentRays[p];
                paths[p].push(P(ray.origin.x+ray.direction.x*1000, ray.origin.y+ray.direction.y*1000));
            }
        }

        // allRays = [...allRays, ...secondaries]
        // allIntersections = [...allIntersections, ...intersections]
        currentRays = secondaries;
    }

    const allRays = ray_steps.flat(1);
    const allIntersections = intersections_steps.flat(1);
    return [
        allRays.filter(r=>r?true:false), 
        allIntersections.filter(i=>i?true:false),
        paths
    ]
}

export {makeRaysFromLights, raytrace, SamplingMethod}