import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";


class LaserLight extends Light
{
    constructor({Cx, Cy, angle=0, intensity=1.0, color=[1,1,1]}={})
    {
        super({Cx, Cy, intensity, color});
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight({
            Cx: this.Cx, 
            Cy: this.Cy, 
            angle: this.angle,
            color: this.color
        });
    }

    toString()
    {
        return `LaserLight(${this.Cx}, ${this.Cy}, ${this.angle.toFixed()})`
    }
}

export default LaserLight