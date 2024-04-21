import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";


class PointLight extends Light
{
    constructor({Cx, Cy, angle=0, intensity=1.0, temperature=6500}={}){
        super({Cx, Cy, intensity, temperature})
        this.angle = angle
    }

    copy()
    {
        return new PointLight({
            Cx: this.Cx, 
            Cy: this.Cy, 
            angle: this.angle,
            temperature: this.temperature
        });
    }

    toString()
    {
        return `Pointlight (${this.Cx}, ${this.Cy} ${this.angle.toFixed(0)})`
    }
}

export default PointLight