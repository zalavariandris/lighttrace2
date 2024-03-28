import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";


class LaserLight extends Light
{
    constructor({Cx, Cy, angle=0, intensity=1.0, wavelength=590}={})
    {
        super({Cx, Cy, intensity, wavelength});
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight({
            Cx: this.Cx, 
            Cy: this.Cy, 
            angle: this.angle,
            wavelength: this.wavelength
        });
    }

    toString()
    {
        return `LaserLight(${this.Cx}, ${this.Cy}, ${this.angle.toFixed()})`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={}){
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        return Array.from({length: sampleCount}).map((_, i)=>{
            return new Lightray({
                origin: P(this.Cx, this.Cy), 
                direction: dir.normalized(1), 
                intensity: this.intensity/sampleCount
            });
        })
    }
}

export default LaserLight