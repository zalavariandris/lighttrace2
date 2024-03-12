// Define an epsilon value
const EPSILON = 1e-6;

class Point{
    constructor(x,y){this.x=x; this.y=y;}
    copy(other){
        return new Point(this.x, this.y)
    }
    distance(p){
        const dx = this.x-p.x;
        const dy = this.y-p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Vector{
    constructor(x,y){this.x=x; this.y=y;}
    copy(other){
        return new Point(this.x, this.y)
    }
    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    multiply(value){
        return new Vector(this.x * value, this.y * value);
    }
    
    normalize(value=1.0) {
        const magnitude = this.magnitude();
        this.x = this.x / magnitude * value
        this.y = this.y / magnitude*value;
    }
    
    normalized(value=1.0) {
        const magnitude = this.magnitude();
        return new Vector(this.x / magnitude * value, this.y / magnitude*value);
    }
    
    reflect(normal) {
        const ray = this.normalized()
        // Normalize the normal vector
        const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        const normalizedNormal = normal.normalized();
        
        // Calculate the dot product
        const dotProduct = ray.dotProduct(normalizedNormal);
        
        // Handle edge case: Zero-length normal vector
        if (Math.abs(dotProduct) < EPSILON) {
            return ray;
        }
        
        // Handle edge case: Parallel vector and normal
        if (Math.abs(dotProduct-1) < EPSILON || Math.abs(dotProduct+1) < EPSILON) {
            return new Vector(-ray.x, -ray.y);
        }
        
        // Calculate the reflected vector
        const reflectedX = ray.x - 2 * dotProduct * normalizedNormal.x;
        const reflectedY = ray.y - 2 * dotProduct * normalizedNormal.y;
        
        return new Vector(reflectedX, reflectedY);
    }
}

class Ray{
    constructor(origin, direction)
    {
        console.assert(origin instanceof Point, `origin must be a Point, got: ${origin}`)
        console.assert(direction instanceof Vector, `direction must be a vector, got: ${direction}`)
        this.origin=origin; this.direction=direction;
    }
    
    copy(other){
        return new Ray(this.origin.copy(), this.direction.copy())
    }
    
    intersectCircle(circle)
    {
        // 
        const d = new Vector(this.origin.x - circle.center.x, this.origin.y - circle.center.y); // to circle

        const dotProduct = this.direction.dotProduct(d.normalized());
        const a = this.direction.dotProduct(this.direction);
        const b = 2 * this.direction.dotProduct(d);
        const c = d.dotProduct(d) - circle.radius * circle.radius;
        const discriminant = b * b - 4 * a * c;
        
        // console.log(discriminant)
        if (discriminant < 0) {
            return [];
        }
        
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);


        // const insideCircle = new Vector(this.origin.x-circle.center.x, this.origin.y-circle.center.y).magnitude()<(circle.radius+EPSILON);
        const outsideCircle = new Vector(this.origin.x-circle.center.x, this.origin.y-circle.center.y).magnitude()>(circle.radius+EPSILON);

        if(outsideCircle){
            // return []
            const t = Math.min(t1, t2);
            // console.log("outside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const origin = P(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y);
            const direction = V(origin.x - circle.center.x, origin.y - circle.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(1))];

            return []
        }else{
            
            const t = Math.max(t1, t2);
            // console.log("inside", t)
            if (t < EPSILON)
            {
                return [];
            }
            const origin = P(this.origin.x + t * this.direction.x, this.origin.y + t * this.direction.y);
            // origin = P(10,10)

            const direction = V(origin.x - circle.center.x, origin.y - circle.center.y).normalized();
            
            return [new Ray(origin, direction.multiply(1))];
        }



        return []

    }

    intersectLineSegment(lineSegment) {
        const ray = this;
        const rayOrigin = ray.origin;
        const rayDirection = ray.direction.normalized();
        const lineSegmentP1 = lineSegment.p1;
        const lineSegmentP2 = lineSegment.p2;
        
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
            const N = new Vector(V.y, -V.x).normalized(); // perpendicular to V
            
            return [new Ray(intersectionPoint, N)];
        }
        
        // No intersection
        return [];
    }
    
    
    intersectRectangle(rectangle) {
        
        const top = rectangle.center.y+rectangle.height/2
        const left = rectangle.center.x-rectangle.width/2
        const bottom = rectangle.center.y-rectangle.height/2
        const right = rectangle.center.x+rectangle.width/2
        
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
            const side_intersections = this.intersectLineSegment(side);
            intersections = [...intersections, ...side_intersections]
        }
        return intersections;
    }
}

function P(x,y){return new Point(x,y)}
function V(x,y){return new Vector(x,y)}

class Circle{
    constructor(center,radius){
        this.center = center, this.radius=radius;
    }
    
    copy(other){
        return new Circle(this.center.copy(), this.radius)
    }
}

class Rectangle {
    constructor(center, width, height) {
        this.center = center;
        this.width = width;
        this.height = height;
    }
    
    copy(other){
        return new Rectangle(this.center.copy(), this.width, this.height)
    }
}

class LineSegment {
    constructor(p1, p2) { 
        this.p1 = p1;
        this.p2 = p2;
    }
    copy(other){
        return new LineSegment(this.p1.copy(), this.p2.copy())
    }
}

export {Point, Vector, Ray}
export {P, V}
export {Circle, Rectangle, LineSegment}