import Shape from "./Shape.js"
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
// import { HitPoint } from "../raytrace.js";
const EPSILON=1e-6;


class Circle extends Shape
{
    constructor({Cx, Cy, material, radius})
    {
        super({Cx, Cy, material})
        this.radius=radius;
    }

    static fromThreePoints(S, M, E, {material}={}) {

        var Sx = S.x;
        var Sy = S.y;
        var Mx = M.x;
        var My = M.y;
        var Ex = E.x;
        var Ey = E.y;
      
        var a = Sx * (My - Ey) - Sy * (Mx - Ex) + Mx * Ey - Ex * My;
      
        var b = (Sx * Sx + Sy * Sy) * (Ey - My) 
              + (Mx * Mx + My * My) * (Sy - Ey)
              + (Ex * Ex + Ey * Ey) * (My - Sy);
       
        var c = (Sx * Sx + Sy * Sy) * (Mx - Ex) 
              + (Mx * Mx + My * My) * (Ex - Sx) 
              + (Ex * Ex + Ey * Ey) * (Sx - Mx);
       
        var Cx = -b / (2 * a);
        var Cy = -c / (2 * a);
      
        return new Circle({
            Cx:Cx, 
            Cy:Cy, 
            material:material, 
            radius: Math.hypot(Cx - Sx, Cy - Sy)
        })
      }

      static fromRadiusAndTwoPoints(r, A, B, flip=false, {material}) {
            const [Ax, Ay] = [A.x, A.y];
            const [Bx, By] = [B.x, B.y];

            const d = Math.sqrt((Ax - Bx)*(Ax - Bx)+ (Ay - By)*(Ay - By))
            const h = (flip?-1:1)*Math.sqrt(r**2 - (d/2.0)**2)

            const alpha = Math.acos(1.0*h/r)
            let Cx = Math.cos(alpha)*r;
            let Cy = Math.sin(alpha)*r;

            Cx+=Bx;
            Cy+=By;

            // Create a new Circle instance using the intersection point as the center
            return new Circle({
                Cx: Cx, 
                Cy: Cy, 
                material: material, 
                radius: r
            });
    }
    
    copy(other)
    {
        return new Circle({
            Cx: this.Cx, 
            Cy: this.Cy, 
            material: this.material, 
            radius: this.radius
        });
    }

    toString()
    {
        return `Circle ${this.key} (${this.Cx.toFixed(1)}, ${this.Cy.toFixed(1)}), r${this.radius.toFixed(1)}`
    }
}

export default Circle