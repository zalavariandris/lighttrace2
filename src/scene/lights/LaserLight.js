import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../../geo.js"
import { Lightray } from "../../raytrace.js";


class LaserLight extends Light
{
    constructor(center, angle=0)
    {
        super(center);
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight(this.center.copy(), this.angle)
    }

    toString()
    {
        return `LaserLight(${this.center}, ${this.angle.toFixed()})`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={}){
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        return Array.from({length: sampleCount}).map((_, i)=>{
            return new Lightray(this.center, dir.normalized(1))
        })
    }
}

export default LaserLight