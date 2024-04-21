import Light from "./Light.js";
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";

class DirectionalLight extends Light
{
    constructor({Cx, Cy, width, angle=0, intensity=1.0, temperature=6500}={})
    {
        super({Cx, Cy, intensity, temperature})
        this.width = width;
        this.angle = angle;
    }

    copy()
    {
        return new DirectionalLight({
            Cx:this.Cx, 
            Cy:this.Cy,
            width: this.width, 
            angle: this.angle,
            intensity: this.intensity,
            temperature: this.temperature
        })
    }

    toString()
    {
        return `DirectionalLight (${this.x} ${this.y}, ${this.angle})`
    }
}

export default DirectionalLight;