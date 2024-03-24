import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../../geo.js"
import { Lightray } from "../../raytrace.js";


class LaserLight extends Light
{
    constructor({x, y, angle=0}={})
    {
        super({x, y});
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight({
            x: this.x, 
            y:this.y, 
            angle: this.angle
        });
    }

    toString()
    {
        return `LaserLight(${this.x}, ${this.y}, ${this.angle.toFixed()})`
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