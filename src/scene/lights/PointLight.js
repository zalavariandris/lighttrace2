import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../../geo.js"
import { Lightray } from "../../raytrace.js";


class PointLight extends Light
{
    constructor({x, y, angle=0}={}){
        super({x, y})
        this.angle = angle;
    }

    copy()
    {
        return new PointLight({
            x: this.x, 
            y:this.y, 
            angle: this.angle
        });
    }

    toString()
    {
        return `Pointlight(${this.x}, ${this.y} ${this.angle.toFixed(0)})`
    }

    sampleRays({sampleCount, samplingMethod=SamplingMethod.Uniform}={})
    {
        
        function makeUniformAngles(N, angleOffset=0)
        {
            return Array.from({length:N},(v,k)=>{
                return k/N*Math.PI*2+angleOffset
            });
        }

        function makeRandomAngles(N, angleOffset=0)
        {
            return Array.from({length:N},(v,k)=>{
                return Math.random()*Math.PI*2+angleOffset;
            });
        }

        const angles = samplingMethod==SamplingMethod.Random ? makeRandomAngles(sampleCount, this.angle) : makeUniformAngles(sampleCount, this.angle)
        return angles.map((a)=>{
            const x = Math.cos(a);
            const y = Math.sin(a);
            const dir = V(x,y);
            return new Lightray(P(this.x, this.y), dir.normalized(1), 1/sampleCount)
        })
    }
}

export default PointLight