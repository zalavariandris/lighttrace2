import {Point, Vector, Ray} from "./geo.js"
import {P, V} from "./geo.js"
const EPSILON=1e-6;

class SceneObject
{
    constructor(center)
    {
        this.center = center;
    }
}

class Shape extends SceneObject
{
    hitTest()
    {
        return null
    }
}

class Circle extends Shape
{
    constructor(center, radius)
    {
        super(center)
        this.radius=radius;
    }
    
    copy(other)
    {
        return new Circle(this.center.copy(), this.radius)
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
            const origin = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
            const direction = V(origin.x - this.center.x, origin.y - this.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(1))];
        }
        else
        {
            const t = Math.max(t1, t2);
            // console.log("inside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const origin = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
            // origin = P(10,10)

            const direction = V(origin.x - this.center.x, origin.y - this.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(-1))];
        }
        return []
    }
}

class Rectangle extends Shape
{
    constructor(center, width, height, angle=0)
    {
        super(center)
        this.width = width;
        this.height = height;
        this.angle = angle
    }
    
    copy(other)
    {
        return new Rectangle(this.center.copy(), this.width, this.height)
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
        
        let intersections = []
        for (const side of sides) {
            const side_intersections = side.hitTest(ray);
            intersections = [...intersections, ...side_intersections]
        }

        return intersections;
    }
}

class LineSegment extends Shape
{
    constructor(p1, p2)
    {
        super(P(0,0))
        this.p1 = p1;
        this.p2 = p2;
    }

    static fromPoints(p1, p2)
    {
        
    }

    copy(other)
    {
        return new LineSegment(this.p1.copy(), this.p2.copy())
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
            const intersectionPoint = P(
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
            
            return [new Ray(intersectionPoint, N)];
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

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={})
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
            return new Ray(this.center, dir.normalized(1))
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
        return `LaserLight(${this.center}, angles)`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={}){
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        return Array.from({length: sampleCount}).map((_, i)=>{
            return new Ray(this.center, dir.normalized(1))
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

            const origin = center.add(offset.multiply(this.width*i/sampleCount-this.width/2))
            
            return new Ray(P(origin.x,origin.y), dir)
        });
    }

    copy()
    {
        return new DirectonalLight(this.center.copy(), this.width, this.angle)
    }
}

export {Shape, Circle, Rectangle, LineSegment}
export {Light, PointLight, LaserLight, DirectonalLight}
export {SamplingMethod}