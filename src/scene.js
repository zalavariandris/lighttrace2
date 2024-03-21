import {Point, Vector} from "./geo.js"
import {P, V} from "./geo.js"

import {Lightray, HitPoint} from "./raytrace.js"

const EPSILON=1e-6;

class SceneObject
{
    constructor(center)
    {
        this.center = center;
    }
}

class Geometry extends SceneObject
{
    constructor(center, material)
    {
        super(center)
        this.material = material;
    }

    hitTest()
    {
        return null
    }
}


class Circle extends Geometry
{
    constructor(center, material, radius)
    {
        super(center, material)
        this.radius=radius;
    }

    static fromThreePoints(S, M, E) {

        var Sx = S.x;
        var Sy = S.y;
        var Mx = M.x;
        var My = M.y;
        var Ex = E.x;
        var Ey = E.y;
      
        var a = Sx * (My - Ey) - Sy * (Mx - Ex) + Mx * Ey - Ex * My;
      
        var b = (Sx * Sx + Sy * Sy) * (Ey - My) 
              + (Mx * Mx + My * My) * (Sy - Ey)
              + (Ex * Ex + Ey * Ey) * (My - Sy);
       
        var c = (Sx * Sx + Sy * Sy) * (Mx - Ex) 
              + (Mx * Mx + My * My) * (Ex - Sx) 
              + (Ex * Ex + Ey * Ey) * (Sx - Mx);
       
        var x = -b / (2 * a);
        var y = -c / (2 * a);
      
        return new Circle(new Point(x, y), null, Math.hypot(x - Sx, y - Sy))
      }

      static fromRadiusAndTwoPoints(r, A, B, flip=false) {
            const [Ax, Ay] = [A.x, A.y];
            const [Bx, By] = [B.x, B.y];

            const d = Math.sqrt((Ax - Bx)*(Ax - Bx)+ (Ay - By)*(Ay - By))
            const h = (flip?-1:1)*Math.sqrt(r**2 - (d/2.0)**2)

            const alpha = Math.acos(1.0*h/r)
            let Cx = Math.cos(alpha)*r;
            let Cy = Math.sin(alpha)*r;

            Cx+=Bx;
            Cy+=By;

            // Create a new Circle instance using the intersection point as the center
            return new Circle(new Point(Cx, Cy), null, Math.abs(r));
    }
    
    copy(other)
    {
        return new Circle(this.center.copy(), this.material.copy(), this.radius)
    }

    toString()
    {
        return `Circle O(${this.center.x.toFixed(1)}, ${this.center.y.toFixed(1)}), r${this.radius.toFixed(1)}`
    }

    hitTest(ray)
    {
        // 
        const d = new Vector(ray.origin.x - this.center.x, ray.origin.y - this.center.y); // to circle

        const dotProduct = ray.direction.dotProduct(d.normalized());
        const a = ray.direction.dotProduct(ray.direction);
        const b = 2 * ray.direction.dotProduct(d);
        const c = d.dotProduct(d) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;
        
        // console.log(discriminant)
        if (discriminant < 0) {
            return [];
        }
        
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        const outsideCircle = new Vector(ray.origin.x-this.center.x, ray.origin.y-this.center.y).magnitude()>(this.radius+EPSILON);

        if(outsideCircle)
        {
            // return []
            const t = Math.min(t1, t2);
            // console.log("outside", t)
            if (t < EPSILON)
            {
                return [];
            }

            const hitPosition = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
            const surfaceNormal = V(hitPosition.x - this.center.x, hitPosition.y - this.center.y).normalized();
            
            return [new HitPoint(hitPosition, surfaceNormal.multiply(1))];
        }
        else
        {
            const t = Math.max(t1, t2);
            // console.log("inside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const hitPosition = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
            // origin = P(10,10)

            const surfaceNormal = V(hitPosition.x - this.center.x, hitPosition.y - this.center.y).normalized();
            
            return [new HitPoint(hitPosition, surfaceNormal.multiply(-1))];
        }
        return []
    }
}


class Lens extends Geometry
{
    constructor(center, material, width, height, leftRadius, rightRadius)
    {
        super(center, material)
        this.width = width
        this.height = height
        this.leftRadius = leftRadius
        this.rightRadius = rightRadius
    }

    copy()
    {
        return new Lens(this.center.copy(), this.material.copy(), this.width, this.height, this.leftRadius, this.rightRadius)
    }

    hitTest(ray)
    {
        const topRight = new Point(this.center.x+this.width/2, this.center.y+this.height/2)
        const bottomRight =  new Point(this.center.x+this.width/2, this.center.y-this.height/2)
        const rightCircle = Circle.fromRadiusAndTwoPoints(Math.abs(this.rightRadius), topRight, bottomRight, true)
        
        const topLeft = new Point(this.center.x-this.width/2, this.center.y+this.height/2)
        const bottomLeft =  new Point(this.center.x-this.width/2, this.center.y-this.height/2)
        const leftCircle = Circle.fromRadiusAndTwoPoints(Math.abs(this.leftRadius), topLeft, bottomLeft, false)

        const hits = [...leftCircle.hitTest(ray), ...rightCircle.hitTest(ray)]

        const top = this.center.y+this.height/2
        const bottom = this.center.y-this.height/2
        const left = leftCircle.center.x-leftCircle.radius;
        const right = rightCircle.center.x+rightCircle.radius;

        return hits.filter((hitPoint)=>{
            const Ix = hitPoint.position.x;
            const Iy = hitPoint.position.y;
            return right+1>Ix && left+1 < Ix && Iy>bottom-1 && Iy<top+1;
        });
    }

    toString(){
        return `Lens(${this.width}x${this.height} left: ${this.leftRadius}, right: ${this.rightRadius})`
    }
}

class Rectangle extends Geometry
{
    constructor(center, material, width, height, angle=0)
    {
        super(center, material);
        this.width = width;
        this.height = height;
        this.angle = angle
    }
    
    copy(other)
    {
        return new Rectangle(this.center.copy(), this.material.copy(), this.width, this.height)
    }

    toString()
    {
        return `Rectangle O(${this.center.x.toFixed(1)}, ${this.center.y.toFixed(1)}), ${this.width.toFixed(1)}x${this.height.toFixed(1)}`
    }

    contains(point)
    { 
        // Calculate half width and half height of the rectangle
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
    
        // Calculate the bounds of the rectangle
        const minX = this.center.x - halfWidth;
        const maxX = this.center.x + halfWidth;
        const minY = this.center.y - halfHeight;
        const maxY = this.center.y + halfHeight;
    
        // Check if the point is within the bounds of the rectangle
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }

    hitTest(ray)
    {
        const top = this.center.y+this.height/2
        const left = this.center.x-this.width/2
        const bottom = this.center.y-this.height/2
        const right = this.center.x+this.width/2
        
        const topLeft = new Point(left, top)
        const bottomRight = new Point(right, bottom)
        const topRight = new Point(right, top)
        const bottomLeft = new Point(left, bottom)
        
        const sides = [
            new LineSegment(topLeft, topRight),
            new LineSegment(topRight, bottomRight),
            new LineSegment(bottomRight, bottomLeft),
            new LineSegment(bottomLeft, topLeft)
        ];
        
        let hits = []
        for (const side of sides) {
            const side_hits = side.hitTest(ray);
            hits = [...hits, ...side_hits]
        }

        return hits;
    }
}

class LineSegment extends Geometry
{
    constructor(p1, p2, material)
    {
        super(P(0,0), material)
        this.p1 = p1;
        this.p2 = p2;
    }

    static fromPoints(p1, p2)
    {
        
    }

    copy(other)
    {
        return new LineSegment(this.p1.copy(), this.p2.copy(), this.material.copy())
    }

    toString()
    {
        return `LineSegment P(${this.p1.x.toFixed(1)}, ${this.p1.y.toFixed(1)}), P(${this.p2.x.toFixed(1)}, ${this.p2.y.toFixed(1)})`
    }

    hitTest(ray)
    {
        const rayOrigin = ray.origin;
        const rayDirection = ray.direction.normalized();
        const lineSegmentP1 = this.p1;
        const lineSegmentP2 = this.p2;
        
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

            if(ray.direction.dotProduct(N)>0){
                N = N.negate()
            }
            
            return [new HitPoint(hitPosition, N)];
        }
        
        // No intersection
        return [];
    }
}

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

class Light extends SceneObject
{
    sampleRays()
    {
        return []
    }
}

class PointLight extends Light
{
    constructor(center){
        super(center)
    }

    copy()
    {
        return new PointLight(this.center.copy())
    }

    toString()
    {
        return `Pointlight(${this.center})`
    }

    sampleRays({sampleCount, samplingMethod=SamplingMethod.Uniform}={})
    {
        
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
        return angles.map((a)=>{
            const x = Math.cos(a);
            const y = Math.sin(a);
            const dir = V(x,y);
            return new Lightray(this.center, dir.normalized(1))
        })
    }
}

class LaserLight extends Light
{
    constructor(center, angle=0)
    {
        super(center);
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight(this.center.copy(), this.angle)
    }

    toString()
    {
        return `LaserLight(${this.center}, ${this.angle})`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={}){
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        return Array.from({length: sampleCount}).map((_, i)=>{
            return new Lightray(this.center, dir.normalized(1))
        })
    }
}

class DirectonalLight extends Light
{
    constructor(center, width, angle)
    {
        super(center)
        this.width = width;
        this.angle = angle
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={})
    {
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        const offset = V(Math.cos(this.angle+Math.PI/2), Math.sin(this.angle+Math.PI/2))
        const center = V(this.center.x,this.center.y)
        return Array.from({length: sampleCount}).map((_, i)=>{

            const randomRayOffset = this.width*Math.random()-this.width/2
            const uniformRayOffset = this.width*(i)/(sampleCount-1)-this.width/2

            const origin = center.add(offset.multiply(samplingMethod==SamplingMethod.Random?randomRayOffset:uniformRayOffset))
            
            return new Lightray(P(origin.x,origin.y), dir)
        });
    }

    copy()
    {
        return new DirectonalLight(this.center.copy(), this.width, this.angle)
    }

    toString()
    {
        return `DirectonalLight(${this.center}, ${this.angle})`
    }
}

class Material{
    constructor()
    {
    }

    copy()
    {
        return new Material()
    }

    sample(V, N)
    {
        return null;
    }
}

function sampleMirror(V, N)
{
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
    // else /* collide from inside*/
    // {
    //     var r  = ior/1;
    //     return V.multiply(r).add( N.multiply(r*c + Math.sqrt( 1-Math.pow(r,2) * (1-Math.pow(c,2) )  )) );
    // }
}

function sampleDiffuse(V, N)
{
    const spread = 1/1;
    const angle = Math.random()*Math.PI*spread-Math.PI*spread/2 + Math.atan2(N.y, N.x);
    
    return new Vector(Math.cos(angle), Math.sin(angle));
}

class MirrorMaterial
{
    constructor(){}

    copy()
    {
        return new MirrorMaterial()
    }

    sample(V, N)
    {
        return sampleMirror(V, N)
    }
}

class TransparentMaterial
{
    constructor(){}

    copy()
    {
        return new TransparentMaterial()
    }

    sample(V, N)
    {
        return sampleTransparent(V, N)
    }
}


class DiffuseMaterial
{
    constructor(){}

    copy(){
        return new DiffuseMaterial();
    }

    sample(V, N)
    {
        return sampleDiffuse(V, N)
    }
}

export {Geometry, Circle, Rectangle, LineSegment, Lens}
export {Light, PointLight, LaserLight, DirectonalLight}
export {Material, MirrorMaterial, TransparentMaterial, DiffuseMaterial};
export {SamplingMethod}