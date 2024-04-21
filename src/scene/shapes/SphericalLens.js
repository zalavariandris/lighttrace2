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



    hitTest(ray)
    {
        // create compound shapes
        const leftCircle = this.getLeftCircle()
        const rightCircle = this.getRightCircle()

        const Cx = this.Cx;
        const Cy = this.Cy
        const topLeft =  P(Cx - this.edgeThickness/2, Cy+this.diameter/2)
        const topRight = P(Cx + this.edgeThickness/2, Cy+this.diameter/2)
        const bottomLeft =  P(Cx - this.edgeThickness/2, Cy+-this.diameter/2)
        const bottomRight = P(Cx + this.edgeThickness/2, Cy+-this.diameter/2)

        const topSide = new LineSegment(topLeft, topRight);
        const bottomSide = new LineSegment(bottomLeft, bottomRight);

        // calc all possible hits
        const leftCircleHitPoints = leftCircle.hitTest(ray);
        const rightCircleHitPoints = rightCircle.hitTest(ray);
        if(this.centerThickness<this.edgeThickness)
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
        const {top, bottom, left, right} = this.bbox();

        // return hitPoints;

        return hitPoints.filter((hitPoint)=>{
            const Ix = hitPoint.position.x;
            const Iy = hitPoint.position.y;
            return right+1>Ix && left-1 < Ix && Iy>bottom-1 && Iy<top+1;
        });
    }
}

export default SphericalLens