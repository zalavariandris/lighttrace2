import Shape from "./Shape.js"
import {Point, Vector} from "../geo.js"
import {P, V} from "../geo.js"
import { HitPoint } from "../raytrace.js";
const EPSILON=1e-6;

class Circle extends Shape
{
    constructor({Cx, Cy, material, radius})
    {
        super({Cx, Cy, material})
        this.radius=radius;
    }

    static fromThreePoints(S, M, E) {

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
            material:null, 
            radius: Math.hypot(Cx - Sx, Cy - Sy)
        })
      }

      static fromRadiusAndTwoPoints(r, A, B, flip=false) {
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
                material: null, 
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

    hitTest(ray)
    {
        // solve quadratic equatation: at**2+bt+c=0
        const d = new Vector(ray.origin.x - this.Cx, ray.origin.y - this.Cy); // to circle
        const a = ray.direction.dotProduct(ray.direction);
        const b = 2 * ray.direction.dotProduct(d);
        const c = d.dotProduct(d) - this.radius * this.radius;
        const discriminant = b * b - 4 * a * c;
        
        if (discriminant < 0)
        {
            return [];
        }
        
        // calc the distance along the ray (parameter of intersection points)
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

        
        let t=-1;
        if(t1>0 && t2>0)
        {
            t = Math.min(t1, t2)
        }
        else if(t1>0)
        {
            t = t1
        }
        else if(t2>0)
        {
            t = t2
        }
        else
        {
            return []
        }

        return [t1, t2].filter(t=>t>EPSILON).map( t => {
            const hitPosition = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
            const surfaceNormal = V(hitPosition.x - this.Cx, hitPosition.y - this.Cy).normalized();
            
            return new HitPoint(hitPosition, surfaceNormal);
        })
    }
}

export default Circle