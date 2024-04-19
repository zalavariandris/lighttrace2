import Light from "./Light.js"
import { SamplingMethod } from "./Light.js";
import {P, V} from "../geo.js"
import { Lightray } from "../raytrace.js";


class PointLight extends Light
{
    constructor({Cx, Cy, angle=0, intensity=1.0, color=[1,1,1]}={}){
        super({Cx, Cy, intensity, color})
        this.angle = angle
    }

    copy()
    {
        return new PointLight({
            Cx: this.Cx, 
            Cy: this.Cy, 
            angle: this.angle,
            color: this.color
        });
    }

    toString()
    {
        return `Pointlight (${this.Cx}, ${this.Cy} ${this.angle.toFixed(0)})`
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

            return new Lightray({
                origin: P(this.Cx, this.Cy), 
                direction: dir.normalized(1), 
                intensity: this.intensity/sampleCount,
                wavelength: this.sampleWavelength()
            });
        })
    }
}

export default PointLight