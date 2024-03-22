import Shape from "./Shape.js"
import LineSegment from "./LineSegment.js"
import Circle from "./Circle.js"
import {Point, Vector} from "../../geo.js"
import {P, V} from "../../geo.js"
import { HitPoint } from "../../raytrace.js";
class SphericalLens extends Shape
{
    constructor(center, material, width, height, leftRadius, rightRadius)
    {
        super(center, material)
        this.width = width;
        this.height = height;
        this.leftRadius = leftRadius;
        this.rightRadius = rightRadius;
    }

    copy()
    {
        return new Lens(this.center.copy(), this.material.copy(), this.width, this.height, this.leftRadius, this.rightRadius)
    }

    getRightCircle()
    {
        const topRight = new Point(this.center.x+this.width/2, this.center.y+this.height/2)
        const bottomRight =  new Point(this.center.x+this.width/2, this.center.y-this.height/2)
        const topLeft = new Point(this.center.x-this.width/2, this.center.y+this.height/2)
        const bottomLeft =  new Point(this.center.x-this.width/2, this.center.y-this.height/2)

        const flip = this.rightRadius>0
        return Circle.fromRadiusAndTwoPoints(Math.abs(this.rightRadius), topRight, bottomRight, flip)
    }

    getLeftCircle()
    {
        const topRight = new Point(this.center.x+this.width/2, this.center.y+this.height/2)
        const bottomRight =  new Point(this.center.x+this.width/2, this.center.y-this.height/2)
        const topLeft = new Point(this.center.x-this.width/2, this.center.y+this.height/2)
        const bottomLeft =  new Point(this.center.x-this.width/2, this.center.y-this.height/2)
        const flip = this.leftRadius<0
        return Circle.fromRadiusAndTwoPoints(Math.abs(this.leftRadius), topLeft, bottomLeft, flip)
    }

    bbox()
    {
        return {
            top: this.center.y+this.height/2,
            bottom: this.center.y-this.height/2,
            left: leftCircle.center.x-leftCircle.radius,
            right: rightCircle.center.x+rightCircle.radius
        };
    }

    hitTest(ray)
    {
        const topRight = new Point(this.center.x+this.width/2, this.center.y+this.height/2)
        const bottomRight =  new Point(this.center.x+this.width/2, this.center.y-this.height/2)
        const topLeft = new Point(this.center.x-this.width/2, this.center.y+this.height/2)
        const bottomLeft =  new Point(this.center.x-this.width/2, this.center.y-this.height/2)

        const topSide = new LineSegment(topLeft, topRight)
        const bottomSide = new LineSegment(bottomLeft, bottomRight)


        const rightCircle = this.getRightCircle()
        const leftCircle = this.getLeftCircle()

        const hits = [...leftCircle.hitTest(ray), ...rightCircle.hitTest(ray), ...topSide.hitTest(ray), ...bottomSide.hitTest(ray)]

        const top = this.center.y+this.height/2
        const bottom = this.center.y-this.height/2
        const left = leftCircle.center.x-leftCircle.radius;
        const right = rightCircle.center.x+rightCircle.radius;

        return hits.filter((hitPoint)=>{
            const Ix = hitPoint.position.x;
            const Iy = hitPoint.position.y;
            return right+1>Ix && left-1 < Ix && Iy>bottom-1 && Iy<top+1;
        });
    }

    toString()
    {
        return `Lens(${this.width}x${this.height} left: ${this.leftRadius}, right: ${this.rightRadius})`
    }
}

export default SphericalLens