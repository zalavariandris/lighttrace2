import {Point, Vector, P, V} from "./geo.js"
import {SamplingMethod} from "./lights/Light.js"
import _ from "lodash"

class Lightray
{
    constructor({origin, direction, intensity=0.5, wavelength=550}={})
    {
        this.origin = origin;
        this.direction = direction;
        this.intensity = intensity;
        this.wavelength = wavelength;
    }

    copy()
    {
        return new Lightray({
            origin: this.origin, 
            direction: this.direction, 
            intensity: this.intensity, 
            wavelength: this.wavelength
        });
    }

    toString()
    {
        return `Lightray(${this.origin}, ${this.direction}, ${this.intensity}, ${this.wavelength})`
    }
}

class HitPoint
{
     constructor({position, surfaceNormal, shape}={})
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
    constructor(lightrays, hitPoints, lightPaths)
    {
        this.lightrays = lightrays;
        this.hitPoints = hitPoints;
        this.lightPaths = lightPaths;
    }
}


// handle light sampling
function sampleWavelength(temperature)
{
    return Math.random()*300+380
}

function samplePointlight(light, {sampleCount, samplingMethod})
{
    function makeUniformAngles(N, angleOffset=0)
    {
        return Array.from({length:N},(v,k)=>{
            return k/N*Math.PI*2+angleOffset
        });
    }

    function makeRandomAngles(N, angleOffset=0)
    {
        return Array.from({length:N},(v,k)=>{
            return Math.random()*Math.PI*2+angleOffset;
        });
    }

    const angles = samplingMethod==SamplingMethod.Random ? makeRandomAngles(sampleCount, light.angle) : makeUniformAngles(sampleCount, light.angle);

    return angles.map((a)=>{
        const x = Math.cos(a);
        const y = Math.sin(a);
        const dir = V(x,y);

        return new Lightray({
            origin: P(light.Cx, light.Cy), 
            direction: dir.normalized(1), 
            intensity: light.intensity/sampleCount,
            wavelength: sampleWavelength(light.temperature, light.intensity)
        });
    })
}

function sampleLaserLight(light, {sampleCount, samplingMethod})
{
    const x = Math.cos(light.angle);
    const y = Math.sin(light.angle);
    const dir = V(x,y);

    return Array.from({length: sampleCount}).map((_, i)=>{
        return new Lightray({
            origin: P(light.Cx, light.Cy), 
            direction: dir.normalized(1), 
            intensity: light.intensity/sampleCount,
            wavelength: sampleWavelength(light.temperature)
        });
    })
}

function sampleDirectionalLight(light, {sampleCount, samplingMethod})
{
    const x = Math.cos(light.angle);
    const y = Math.sin(light.angle);
    const dir = V(x,y);
    const offset = V(Math.cos(light.angle+Math.PI/2), Math.sin(light.angle+Math.PI/2))
    const center = V(light.Cx,light.Cy)
    return Array.from({length: sampleCount}).map((_, i)=>{

        const randomRayOffset = light.width*Math.random()-light.width/2
        const uniformRayOffset = light.width*(i)/(sampleCount-1)-light.width/2

        const origin = center.add(offset.multiply(samplingMethod==SamplingMethod.Random?randomRayOffset:uniformRayOffset))
        
        return new Lightray({
            origin: P(origin.x,origin.y), 
            direction: dir, 
            intensity: light.intensity/sampleCount,
            color: light.color
        });
    });
}

// handle ray hit shapes
function hitCircle(ray, circle)
{
    // solve quadratic equatation: at**2+bt+c=0
    const d = new Vector(ray.origin.x - circle.Cx, ray.origin.y - circle.Cy); // to circle
    const a = ray.direction.dotProduct(ray.direction);
    const b = 2 * ray.direction.dotProduct(d);
    const c = d.dotProduct(d) - circle.radius * circle.radius;
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0)
    {
        return [];
    }
    
    // calc the distance along the ray (parameter of intersection points)
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    let t=-1;
    if(t1>0 && t2>0)
    {
        t = Math.min(t1, t2)
    }
    else if(t1>0)
    {
        t = t1
    }
    else if(t2>0)
    {
        t = t2
    }
    else
    {
        return []
    }

    return [t1, t2].filter(t=>t>EPSILON).map( t => {
        const hitPosition = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
        const surfaceNormal = V(hitPosition.x - circle.Cx, hitPosition.y - circle.Cy).normalized();
        
        return new HitPoint({
            position: hitPosition, 
            surfaceNormal: surfaceNormal,
            shape: circle
        });
    })
}

function hitLineSegment(ray, shape)
{
    const rayOrigin = ray.origin;
    const rayDirection = ray.direction.normalized();
    const lineSegmentP1 = new Point(shape.Ax, shape.Ay);
    const lineSegmentP2 = new Point(shape.Bx, shape.By);
    
    // Calculate the direction vector of the line segment
    const lineSegmentDirection = new Vector(
        lineSegmentP2.x - lineSegmentP1.x,
        lineSegmentP2.y - lineSegmentP1.y,
    );
    
    // Calculate the determinant
    const determinant = rayDirection.x * lineSegmentDirection.y - rayDirection.y * lineSegmentDirection.x;

    // If the determinant is close to zero, the lines are parallel
    if (Math.abs(determinant) < EPSILON) {
        return [];
    }
    
    // Calculate the intersection point
    const t1 = ((lineSegmentP1.x - rayOrigin.x) * lineSegmentDirection.y - (lineSegmentP1.y - rayOrigin.y) * lineSegmentDirection.x) / determinant;
    const t2 = ((lineSegmentP1.x - rayOrigin.x) * rayDirection.y - (lineSegmentP1.y - rayOrigin.y) * rayDirection.x) / determinant;
    
    // Check if the intersection point is within the line segment and the ray
    if (t1 >= -EPSILON && t2 >= -EPSILON && t2 <= 1 + EPSILON) {
        const hitPosition = P(
            rayOrigin.x + t1 * rayDirection.x,
            rayOrigin.y + t1 * rayDirection.y,
        );
        
        // TODO EDGE cases
        // // Check if the intersection point is at the ray origin
        // if (Math.abs(t1) < EPSILON) {
        //     return rayOrigin;
        // }
        
        // // Check if the intersection point is at one of the line segment endpoints
        // if (Math.abs(t2) < EPSILON) {
        //     return lineSegmentP1;
        // }
        // if (Math.abs(t2 - 1) < EPSILON) {
        //     return lineSegmentP2;
        // }
        
        // Calculate the line normal
        const V = new Vector(lineSegmentP1.x - lineSegmentP2.x, lineSegmentP1.y - lineSegmentP2.y);
        let N = new Vector(V.y, -V.x).normalized(1); // perpendicular to V

        // if(ray.direction.dotProduct(N)>0){
        //     N = N.negate()
        // }
        
        return [new HitPoint({
            position: hitPosition, 
            surfaceNormal: N,
            shape: shape
        })];
    }
    
    // No intersection
    return [];
}

function hitRectangle(ray, shape)
{
    const top =    shape.Cy - shape.height/2;
    const left =   shape.Cx - shape.width/2;
    const bottom = shape.Cy + shape.height/2;
    const right =  shape.Cx + shape.width/2;
    
    const sides = [
        new LineSegment({Ax:left, Ay: top, Bx:right, By:top}),
        new LineSegment({Bx:right, By: bottom, Ax:right, Ay:top}),
        new LineSegment({Ax:right, Ay: bottom, Bx:left, By:bottom}),
        new LineSegment({Ax:left, Ay: bottom, Bx:left, By:top})
    ];
    
    // merge all
    let hits = []
    for (const side of sides)
    {
        const side_hits = side.hitTest(ray);
        hits = [...hits, ...side_hits]
    }

    return hits;
}

function hitSphericalLens(ray, lens)
{
    // create compound shapes
    const leftCircle = lens.getLeftCircle();
    leftCircle.material = lens.material;
    const rightCircle = lens.getRightCircle();
    rightCircle.material = lens.material;

    const Cx = lens.Cx;
    const Cy = lens.Cy
    const topLeft =  P(Cx - lens.edgeThickness/2, Cy+lens.diameter/2)
    const topRight = P(Cx + lens.edgeThickness/2, Cy+lens.diameter/2)
    const bottomLeft =  P(Cx - lens.edgeThickness/2, Cy+-lens.diameter/2)
    const bottomRight = P(Cx + lens.edgeThickness/2, Cy+-lens.diameter/2)

    const topSide = new LineSegment(topLeft, topRight);
    const bottomSide = new LineSegment(bottomLeft, bottomRight);

    // calc all possible hits
    const leftCircleHitPoints = leftCircle.hitTest(ray);
    const rightCircleHitPoints = rightCircle.hitTest(ray);
    if(lens.centerThickness<lens.edgeThickness)
    {
        for(let hitPoint of leftCircleHitPoints)
        {
            hitPoint.surfaceNormal = hitPoint.surfaceNormal.negate()
        }
        for(let hitPoint of rightCircleHitPoints)
        {
            hitPoint.surfaceNormal = hitPoint.surfaceNormal.negate()
        }
    }
    const hitPoints = [
        ...leftCircleHitPoints,
        ...rightCircleHitPoints,
        ...topSide.hitTest(ray),
        ...bottomSide.hitTest(ray)
    ]

    // filter to bbox
    const {top, bottom, left, right} = lens.bbox();

    // return hitPoints;

    return hitPoints.filter((hitPoint)=>{
        const Ix = hitPoint.position.x;
        const Iy = hitPoint.position.y;
        return right+1>Ix && left-1 < Ix && Iy>bottom-1 && Iy<top+1;
    });
}

// handle materials
function sampleTransparent(incidentRay, hitPoint, ior) {
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

function makeRaysFromLights(lights, {sampleCount, samplingMethod})
{
    // angles to rays
    return lights.map((light)=>{
        switch (light.constructor.name) {
            case "PointLight":
                return samplePointlight(light, {sampleCount, samplingMethod});
                break;
            case "LaserLight":
                return sampleLaserLight(light, {sampleCount, samplingMethod});
                break;
            case "DirectionalLight":
                return sampleDirectionalLight(light, {sampleCount, samplingMethod});
                break;
            default:
                break;
        }
    }).flat(1);
}


function raytrace_pass(rays, [shapes, materials], {THRESHOLD=1e-6})
{
    // intersection

    const THRESHOLD_SQUARED = THRESHOLD**THRESHOLD;

    const hitPoints = rays.map((ray)=>{
        if(ray==null)
        {
            return [null, null, null];
        }

        const raySceneHitPoints = _.zipWith(shapes, materials).map(([shape, material])=>{
            
            let hitPoints = shape.hitTest(ray)
            
            // filter raypoints within distance threshold
            hitPoints = hitPoints.filter(hitPoint=>{
                return hitPoint.position.distanceTo2(ray.origin)>THRESHOLD_SQUARED;
            });

            // attach shape and material data
            return hitPoints.map(hitPoint=>{
                return [hitPoint, shape, material];
            })
        }).flat(1);

        // return closest intersection of ray
        return raySceneHitPoints.reduce(([A, shapeA, materialA],[B, shapeB, materialB])=>{
            if(A===null) return [B, shapeB, materialB];
            if(B===null) return [A, shapeA, materialA];
            return A.position.distanceTo(ray.origin) < B.position.distanceTo(ray.origin) ? [A, shapeA, materialA]: [B,shapeB, materialB];
        }, [null, null, null]);
    });

    // secondary rays
    const secondaries = hitPoints.map(([hitPoint, shape, material], i)=>{
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

            // // calculate hitNormal from surface normal and ray direction. 
            // const IsInside = incidentDirection.dotProduct(hitPoint.surfaceNormal)>0;
            // const hitNormal = IsInside?surfaceNormal.negate():surfaceNormal;

            return sampleTransparent(incidentRay, hitPoint, 1.44);

            const bounceDirection = material.sample(incidentDirection, surfaceNormal);
            const bounceIntensity = incidentRay.intensity*1.0;
            return new Lightray({
                origin: hitPoint.position, 
                direction: bounceDirection, 
                intensity: bounceIntensity,
                wavelength: incidentRay.wavelength
            });
        }
    });

    return [secondaries, hitPoints.map(hitData=>hitData[0])];
}

function raytrace(lights, [shapes, materials], {maxBounce=3, samplingMethod="Uniform", lightSamples=9}={})
{
    // initial rays
    const initialLightrays = makeRaysFromLights(lights, {sampleCount: lightSamples, samplingMethod:samplingMethod});

    // raytrace steps
    let currentRays = initialLightrays;
    const raytraceSteps = [initialLightrays];
    const hitPointSteps = [];
    const lightPaths = initialLightrays.map(r=>new LightPath([r]));
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
            if(lightRay)
            {
                lightPath.rays.push(lightRay);
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