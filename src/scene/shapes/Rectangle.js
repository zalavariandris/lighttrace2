import Shape from "./Shape.js"
import LineSegment from "./LineSegment.js";
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
import { HitPoint } from "../raytrace.js";

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

    hitTest(ray)
    {
        const top =    this.Cy+this.height/2
        const left =   this.Cx-this.width/2
        const bottom = this.Cy-this.height/2
        const right =  this.Cx+this.width/2
        
        const topLeft = new Point(left, top)
        const bottomRight = new Point(right, bottom)
        const topRight = new Point(right, top)
        const bottomLeft = new Point(left, bottom)
        
        const sides = [
            new LineSegment({Ax:left, Ay: top, Bx:right, By:top}),
            new LineSegment({Bx:right, By: bottom, Ax:right, Ay:top}),
            new LineSegment({Ax:right, Ay: bottom, Bx:left, By:bottom}),
            new LineSegment({Ax:left, Ay: bottom, Bx:left, By:top}),
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