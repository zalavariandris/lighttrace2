import Shape from "./Shape.js"
import LineSegment from "./LineSegment.js";
import {Point, Vector} from "../../geo.js"
import {P, V} from "../../geo.js"
import { HitPoint } from "../../raytrace.js";

class Rectangle extends Shape
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

export default Rectangle;