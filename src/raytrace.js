import {Point, Vector, Ray, P, V} from "./geo.js"
import {Circle, LineSegment, Rectangle} from "./geo.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

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
	var c = - N.normalized().dotProduct(V.normalized());
    var xi = Math.random();
    var sinThetaI = 2.0*xi - 1.0;
    var cosThetaI = Math.sqrt(1.0 - sinThetaI*sinThetaI);

    var V1 = new Vector(cosThetaI, sinThetaI).normalized().rotate(N.angleToXAxis());

    if(c<0)/* collide from outside*/
    {
    	return V1;
    }
    else /* collide from inside*/
    {
    	return V1.negate();
    }
}

function makeRaysFromLights(lights, sampleCount, samplingMethod)
{
    /* Shoot rays from scene lights */
    function makeUniformAngles(N)
    {
        return Array.from({length:N},(v,k)=>{
            return k/N*Math.PI*2
        });
    }

    function makeRandomAngles(N)
    {
        return Array.from({length:N},(v,k)=>{
            return Math.random()*Math.PI*2;
        });
    }

    const angles = samplingMethod==SamplingMethod.Random ? makeRandomAngles(sampleCount) : makeUniformAngles(sampleCount)
    
    // angles to rays
    const rays = angles.map((a)=>{
        return lights.map((light_pos)=>{
            const x = Math.cos(a);
            const y = Math.sin(a);
            const dir = V(x,y);
            return new Ray(light_pos, dir.normalized(1))
        })
    }).flat(1)
    return rays;
}

function intersect(rays, shapes)
{
    // find intersections
    let intersections = []
    for(let ray of rays)
    {
        if(ray == null){
            secondaries = [...secondaries, ...[null]]
            continue;
        }
        
        for(let shape of shapes)
        {
            let shape_intersections = []
            
            if(shape instanceof Circle){
                shape_intersections = [...shape_intersections, ...ray.intersectCircle(shape)];
            } 
            else if(shape instanceof Rectangle){
                shape_intersections = [...shape_intersections, ...ray.intersectRectangle(shape)];
            } else if(shape instanceof LineSegment){
                shape_intersections = [...shape_intersections, ...ray.intersectLineSegment(shape)];
            } 
            intersections = [...intersections, ...shape_intersections];
        }
        
        // if(intersections.length>0)
        // {
        //     // find closest interseciont
        //     let closest = intersections.reduce((a, b) => ray.origin.distance(a.origin) < ray.origin.distance(b.origin) ? a : b);
        //     intersections.push(closest)
        // }
            
        //     // reflect ray on intersection
        //     const reflected_rays = [closest].map((intersection)=>{
        //         const secondary_dir = sampleMirror(ray.direction.normalized(), intersection.direction)
        //         return new Ray(intersection.origin, secondary_dir.normalized(100));
        //     });
            
        //     secondaries = [...secondaries, ...reflected_rays]
        // }else[
        //     secondaries = [...secondaries, ...[null]]
        // ]
    }
    
    // intersections
    return intersections;
}

function trace_rays(rays, shapes)
{
    // find intersections
    let intersections = []
    let secondaries = []
    for(let primary of rays)
    {
        if(primary == null){
            secondaries = [...secondaries, ...[null]]
            continue;
        }
        
        let ray_intersections = [];
        for(let shape of shapes)
        {
            let shape_intersections = []
            
            if(shape instanceof Circle){
                shape_intersections = [...shape_intersections, ...primary.intersectCircle(shape)];
            } 
            else if(shape instanceof Rectangle){
                shape_intersections = [...shape_intersections, ...primary.intersectRectangle(shape)];
            } else if(shape instanceof LineSegment){
                shape_intersections = [...shape_intersections, ...primary.intersectLineSegment(shape)];
            } 
            ray_intersections = [...ray_intersections, ...shape_intersections];
            
        }
        
        if(ray_intersections.length>0)
        {
            // find closest interseciont
            let closest = ray_intersections.reduce((a, b) => primary.origin.distance(a.origin) < primary.origin.distance(b.origin) ? a : b);
            ray_intersections.push(closest)
            
            // reflect ray on intersection
            const reflected_rays = [closest].map((intersection)=>{
                const secondary_dir = sampleMirror(primary.direction.normalized(), intersection.direction)
                // const secondary_dir = primary.direction.reflect(i.direction)
                return new Ray(intersection.origin, secondary_dir.normalized(100));
            });
            
            secondaries = [...secondaries, ...reflected_rays]
        }else[
            secondaries = [...secondaries, ...[null]]
        ]
    }
    
    // intersections
    return [secondaries, intersections];
}

function raytrace(lights, shapes, options={maxBounce:3, sampling:SamplingMethod.Random, lightSamples:50})
{
    const rays = makeRaysFromLights(lights, options.lightSamples, options.sampling);

    //
    let paths = rays.map((ray)=>[ray.origin])
    let all_intersections = []
    let current_rays = [...rays];
    let all_rays = [...current_rays]
    const path_count = rays.length

    // const intersection = intersect(current_rays, shapes)
    // const reflections = intersections.map((intersection, i)=>{
    //     const ray = current_rays[i]
    //     return ray.reflection(intersection)
    // });

    for(let i=0; i<options.maxBounce; i++)
    {
        let [secondary, intersections] = trace_rays(current_rays, shapes);
        
        for(let ray_index=0; ray_index<path_count; ray_index++)
        {
            const ray = current_rays[ray_index];
            const reflection = secondary[ray_index]
            const path = paths[ray_index]
            
            if(reflection != null)
            {
                let p = reflection.origin
                path.push(p)
            }
            else if(ray != null)
            {
                let dir = ray.direction.normalized(1000)
                let p = new Point(ray.origin.x+dir.x, ray.origin.y+dir.y)
                path.push(p)
            }
        }
        current_rays = secondary;
        all_rays = [...all_rays, ...secondary]
        all_intersections = [...all_intersections, intersections]
    }
    all_rays = all_rays.filter((ray)=>ray != null);
    return [paths, all_intersections];
}

export {makeRaysFromLights, intersect, raytrace, SamplingMethod}
export {sampleMirror, sampleTransparent, sampleDiffuse, intersect, raytrace, SamplingMethod}