import Light from "./Light.js";
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";

class DirectionalLight extends Light
{
    constructor({Cx, Cy, width, angle=0, intensity=1.0, wavelength=590}={})
    {
        super({Cx, Cy, intensity, wavelength})
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
        const center = V(this.Cx,this.Cy)
        return Array.from({length: sampleCount}).map((_, i)=>{

            const randomRayOffset = this.width*Math.random()-this.width/2
            const uniformRayOffset = this.width*(i)/(sampleCount-1)-this.width/2

            const origin = center.add(offset.multiply(samplingMethod==SamplingMethod.Random?randomRayOffset:uniformRayOffset))
            
            return new Lightray({origin: P(origin.x,origin.y), direction: dir, intensity: this.intensity/sampleCount})
        });
    }

    
}

export default DirectionalLight;