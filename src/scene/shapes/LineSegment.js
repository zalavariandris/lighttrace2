import Shape from "./Shape.js"
const EPSILON=1e-6;
import {Point, Vector} from "../../geo.js"
import {P, V} from "../../geo.js"
import { HitPoint } from "../../raytrace.js";


class LineSegment extends Shape
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

export default LineSegment