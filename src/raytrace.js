import {Point, Vector, Ray, P, V} from "./geo.js"
import {Circle, LineSegment, Rectangle} from "./scene.js"
import {Light, PointLight, LaserLight} from "./scene.js"
import {SamplingMethod} from "./scene.js"

function sampleMirror(V, N){
	return V.subtract(N.multiply(2*V.dotProduct(N)));
}

function sampleTransparent(V, N, ior=1.440)
{
	var c = - N.dotProduct(V);
	if(c>0)/* collide from outside*/
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

function sampleDiffuse(V, N)
{
    const spread = 1/1;
    const angle = Math.random()*Math.PI*spread-Math.PI*spread/2 + Math.atan2(N.y, N.x);
    
    return new Vector(Math.cos(angle), Math.sin(angle));
}

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

            // const secondary = sampleTransparent(ray.direction.normalized(1), intersection.direction.normalized(1))
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

function raytrace(lights, [shapes, materials], {maxBounce=3, samplingMethod="Uniform", lightSamples=9}={})
{
    // initial rays
    const initial_rays = makeRaysFromLights(lights, {lightSamples, samplingMethod});

    // raytrace steps
    let currentRays = initial_rays;
    const ray_steps = [initial_rays];
    const intersections_steps = [];
    const paths = initial_rays.map(r=>[r.origin]);
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, intersections] = raytrace_pass(currentRays, [shapes, materials], {THRESHOLD:1e-6});
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
export {sampleMirror, sampleTransparent, sampleDiffuse}