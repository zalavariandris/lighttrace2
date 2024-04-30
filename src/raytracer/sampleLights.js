import { SamplingMethod } from "../stores/raytraceOptionsStore.js";
import {Point, Vector, P, V} from "../scene/geo.js"
import Lightray from "./LightRay.js";

/* SAMPLE LIGHT SOURCES */
function sampleWavelength(temperature)
{
    // return sampleBlackbody(temperature, 10);
    return Math.random()*300+380
    // return 550;
}

function sampleLight(light, {sampleCount, samplingMethod})
{
    switch (light.constructor.name) {
        case "PointLight":
            return samplePointlight(light, {sampleCount:sampleCount, samplingMethod});
        case "LaserLight":
            return sampleLaserLight(light, {sampleCount:sampleCount, samplingMethod});
        case "DirectionalLight":
            return sampleDirectionalLight(light, {sampleCount:sampleCount, samplingMethod});
        default:
            return [];
    }
}


function samplePointlight(light, {sampleCount, samplingMethod})
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

    const angles = samplingMethod==SamplingMethod.Random ? makeRandomAngles(sampleCount, light.angle) : makeUniformAngles(sampleCount, light.angle);

    return angles.map((a)=>{
        const x = Math.cos(a);
        const y = Math.sin(a);
        const dir = V(x,y);

        return new Lightray({
            origin: P(light.Cx, light.Cy), 
            direction: dir.normalized(1), 
            intensity: light.intensity/sampleCount,
            wavelength: sampleWavelength(light.temperature)
        });
    })
}

function sampleLaserLight(light, {sampleCount, samplingMethod})
{
    const x = Math.cos(light.angle);
    const y = Math.sin(light.angle);
    const dir = V(x,y);

    return Array.from({length: sampleCount}).map((_, i)=>{
        return new Lightray({
            origin: P(light.Cx, light.Cy), 
            direction: dir.normalized(1), 
            intensity: light.intensity/sampleCount,
            wavelength: sampleWavelength(light.temperature)
        });
    })
}

function sampleDirectionalLight(light, {sampleCount, samplingMethod})
{
    const x = Math.cos(light.angle);
    const y = Math.sin(light.angle);
    const dir = V(x,y);
    const offset = V(Math.cos(light.angle+Math.PI/2), Math.sin(light.angle+Math.PI/2))
    const center = V(light.Cx,light.Cy)
    return Array.from({length: sampleCount}).map((_, i)=>{

        const randomRayOffset = light.width*Math.random()-light.width/2
        const uniformRayOffset = light.width*(i)/(sampleCount-1)-light.width/2

        const origin = center.add(offset.multiply(samplingMethod==SamplingMethod.Random?randomRayOffset:uniformRayOffset))
        
        return new Lightray({
            origin: P(origin.x,origin.y), 
            direction: dir, 
            intensity: light.intensity/sampleCount,
            wavelength: sampleWavelength(light.temperature)
        });
    });
}

export {Lightray, sampleLight};