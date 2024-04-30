import Shape from "./Shape.js"
import LineSegment from "./LineSegment.js";
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
// import { HitPoint } from "../raytrace.js";

class Rectangle extends Shape
{
    constructor({Cx, Cy, material, width, height, angle=0}={})
    {
        super({Cx:Cx, Cy:Cy, material});
        this.width = width;
        this.height = height;
        this.angle = angle
    }
    
    copy(other)
    {
        return new Rectangle({
            Cx: this.Cx, 
            Cy: this.Cy, 
            material:this.material, 
            width: this.width, 
            height: this.height, 
            angle: this.angle
        });
    }

    toString()
    {
        return `Rectangle O(${this.Cx.toFixed(1)}, ${this.Cy.toFixed(1)}), ${this.width.toFixed(1)}x${this.height.toFixed(1)}`
    }

    contains(point)
    { 
        // Calculate half width and half height of the rectangle
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
    
        // Calculate the bounds of the rectangle
        const minX = this.Cx - halfWidth;
        const maxX = this.Cx + halfWidth;
        const minY = this.Cy - halfHeight;
        const maxY = this.Cy + halfHeight;
    
        // Check if the point is within the bounds of the rectangle
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
    }
}

export default Rectangle;