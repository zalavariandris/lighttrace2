import Shape from "./Shape.js"
const EPSILON=1e-6;
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
// import { HitPoint } from "../raytrace.js";


class LineSegment extends Shape
{
    constructor({Ax, Ay, Bx, By, material})
    {
        super({Cx:0,Cy:0, material})
        this.Ax = Ax;
        this.Ay = Ay;
        this.Bx = Bx;
        this.By = By;
    }

    copy(other)
    {
        return new LineSegment({
            Ax:this.Ax, 
            Ay:this.Ay, 
            Bx:this.Bx, 
            By:this.By, 
            material:this.material
        })
    }

    toString()
    {
        return `LineSegment (${this.Ax.toFixed(1)}, ${this.Ay.toFixed(1)}), P(${this.Bx.toFixed(1)}, ${this.By.toFixed(1)})`
    }
}

export default LineSegment