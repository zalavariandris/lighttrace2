import Shape from "./Shape.js"
import {Point, P} from "../geo.js"
import Circle from "./Circle.js";
import LineSegment from "./LineSegment.js";


class SphericalLens extends Shape
{
    constructor({Cx, Cy, material, diameter, edgeThickness, centerThickness})
    {
        super({Cx, Cy, material});
        this.diameter = diameter;
        this.edgeThickness = edgeThickness;
        this.centerThickness = centerThickness;
    }

    copy()
    {
        return new SphericalLens({
            Cx: this.Cx, 
            Cy: this.Cy, 
            material: this.material, 
            diameter: this.diameter,
            edgeThickness:this.edgeThickness,
            centerThickness: this.centerThickness
        });
    }

    toString()
    {
        return `SphericalLens(${this.Cx}, ${this.Cy}, d${this.diameter}, ${this.edgeThickness}, ${this.centerThickness})`
    }

    getLeftCircle()
    {
        const Cx = this.Cx;
        const Cy = this.Cy;
        const topLeft =    P(Cx-this.edgeThickness/2,   Cy+this.diameter/2)
        const middleLeft = P(Cx-this.centerThickness/2, Cy+0              )
        const bottomLeft = P(Cx-this.edgeThickness/2,   Cy-this.diameter/2)
        return Circle.fromThreePoints(topLeft, middleLeft, bottomLeft, {material: this.material})
    }

    getRightCircle()
    {
        const Cx = this.Cx;
        const Cy = this.Cy;
        const topRight =    P(Cx+this.edgeThickness/2,   Cy+this.diameter/2)
        const middleRight = P(Cx+this.centerThickness/2, Cy+0               )
        const bottomRight = P(Cx+this.edgeThickness/2,   Cy-this.diameter/2)
        return Circle.fromThreePoints(topRight, middleRight, bottomRight, {materia:this.material})
    }



    bbox()
    {
        const Cx = this.Cx;
        const Cy = this.Cy
        return {
            top: Cy+this.diameter/2,
            bottom: Cy-this.diameter/2,
            left: Cx-Math.max(this.edgeThickness/2, this.centerThickness/2),
            right: Cx+Math.max(this.edgeThickness/2, this.centerThickness/2)
        };
    }
}

export default SphericalLens