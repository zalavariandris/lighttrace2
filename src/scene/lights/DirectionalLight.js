import Light from "./Light.js";
import { SamplingMethod } from "./Light.js";
import {P, V} from "../../geo.js"
import { Lightray } from "../../raytrace.js";

class DirectionalLight extends Light
{
    constructor({x, y, width, angle=0, wavelength=590}={})
    {
        super({x, y, wavelength})
        this.width = width;
        this.angle = angle;
    }

    copy()
    {
        return new DirectionalLight({
            x:this.x, 
            y:this.y,
            width: this.width, 
            angle: this.angle,
            wavelength: this.wavelength
        })
    }

    toString()
    {
        return `DirectionalLight (${this.x} ${this.y}, ${this.angle})`
    }

    sampleRays({sampleCount=9, samplingMethod=SamplingMethod.Uniform}={})
    {
        const x = Math.cos(this.angle);
        const y = Math.sin(this.angle);
        const dir = V(x,y);
        const offset = V(Math.cos(this.angle+Math.PI/2), Math.sin(this.angle+Math.PI/2))
        const center = V(this.x,this.y)
        return Array.from({length: sampleCount}).map((_, i)=>{

            const randomRayOffset = this.width*Math.random()-this.width/2
            const uniformRayOffset = this.width*(i)/(sampleCount-1)-this.width/2

            const origin = center.add(offset.multiply(samplingMethod==SamplingMethod.Random?randomRayOffset:uniformRayOffset))
            
            return new Lightray(P(origin.x,origin.y), dir, 1/sampleCount)
        });
    }

    
}

export default DirectionalLight;