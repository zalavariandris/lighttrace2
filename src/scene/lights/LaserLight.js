import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../../geo.js"
import { Lightray } from "../../raytrace.js";


class LaserLight extends Light
{
    constructor(key, {x, y, angle=0, wavelength=590}={})
    {
        super(key, {x, y, wavelength});
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight(this.key, {
            x: this.x, 
            y:this.y, 
            angle: this.angle,
            wavelength: this.wavelength
        });
    }

    toString()
    {
        return `LaserLight(${this.key}, ${this.x}, ${this.y}, ${this.angle.toFixed()})`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={}){
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        return Array.from({length: sampleCount}).map((_, i)=>{
            return new Lightray(P(this.x, this.y), dir.normalized(1), 1/sampleCount)
        })
    }
}

export default LaserLight