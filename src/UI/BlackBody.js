import React, {useState} from "react"
import _ from "lodash"

const h = React.createElement;

function blackbodyIntensity(wavelength, temperature) {
    const h = 6.62607015e-34; // Planck's constant (m² kg / s)
    const c = 299792458; // Speed of light (m/s)
    const kB = 1.380649e-23; // Boltzmann constant (m² kg / s² K)

    const lambda = wavelength * 1e-9; // Convert wavelength from nm to meters
    const T = temperature; // Temperature in Kelvin

    const numerator = (2 * h * Math.pow(c, 2)) / Math.pow(lambda, 5);
    const denominator = Math.exp((h * c) / (lambda * kB * T)) - 1;

    const intensity = numerator / denominator;

    return intensity;
}

function blackbodyRadiationAtAllFrequencies(temperature, frequencyMin, frequencyMax, numSteps) {
    const h = 6.62607015e-34; // Planck's constant (m² kg / s)
    const c = 299792458; // Speed of light (m/s)
    const kB = 1.380649e-23; // Boltzmann constant (m² kg / s² K)

    const T = temperature; // Temperature in Kelvin
    const deltaNu = (frequencyMax - frequencyMin) / numSteps;

    let totalRadiance = 0;

    for (let i = 0; i < numSteps; i++) {
        const nu = frequencyMin + i * deltaNu;
        const lambda = c / nu; // Convert frequency to wavelength

        const numerator = 2 * h * Math.pow(nu, 3);
        const denominator = Math.exp((h * nu) / (kB * T)) - 1;

        const spectralRadiance = numerator / denominator;
        totalRadiance += spectralRadiance * deltaNu; // Numerical integration using the trapezoidal rule
    }

    return totalRadiance;
}

function randomFrequencyInVisibleRange(temperature) {
    const frequencyMin = 4.3e14; // Minimum frequency in Hz (corresponds to 700 nm)
    const frequencyMax = 7.5e14; // Maximum frequency in Hz (corresponds to 400 nm)

    // Calculate total radiance over the visible range
    const totalRadiance = blackbodyRadiationAtAllFrequencies(temperature, frequencyMin, frequencyMax, 1000);

    // Generate a random value proportional to radiance
    const randomValue = Math.random() * totalRadiance;

    let currentRadiance = 0;
    let randomFrequency = 0;

    // Iterate over frequencies in the visible range
    for (let nu = frequencyMin; nu <= frequencyMax; nu += (frequencyMax - frequencyMin) / 1000) {
        // Calculate spectral radiance at this frequency
        const lambda = 299792458 / nu; // Convert frequency to wavelength
        const spectralRadiance = blackbodyIntensity(lambda * 1e9, temperature); // Convert wavelength to nm and get intensity

        // Accumulate radiance
        currentRadiance += spectralRadiance * ((frequencyMax - frequencyMin) / 1000);

        // If the accumulated radiance exceeds the random value, set the frequency and break
        if (currentRadiance >= randomValue) {
            randomFrequency = nu;
            break;
        }
    }

    return randomFrequency;
}


function BlackBody({
        y=[1,40,30,50,10], 
        x=null,
        minx=null,
        maxx=null,
        miny=0,
        maxy=10000000
    }={})
{
    const [temperature, setTemperature] = React.useState(5200);

    // Example usage:
    const frequencyMin = 1e14; // Minimum frequency in Hz
    const frequencyMax = 1e16; // Maximum frequency in Hz
    const numSteps = 100; // Number of steps for numerical integration

    const radiance = blackbodyRadiationAtAllFrequencies(temperature, frequencyMin, frequencyMax, numSteps);

    // calc blackbody radiation in visible range
    const visibleRange = _.range(380,780,1);

    const visibleIntensity = _.range(380,780,10).map(wavelength => blackbodyIntensity(wavelength, temperature)*500000000000000000/radiance);
    y = visibleIntensity;

    // x spacing
    x = x || y.map((_,i)=>i);

    // auto range
    minx = minx===null ? _.min(x) : minx;
    maxx = maxx===null ? _.max(x) : maxx;
    miny = miny===null ? _.min(y) : miny;
    maxy = maxy===null ? _.max(y) : maxy;

    const rangex = maxx-minx;
    const rangey = maxy-miny;



    const points = _.zip(x,y);


    return h("div", {}, 
        h("svg", {
            width: 256, 
            height: 256,
            viewBox: "0 0 256 256",
            preserveAspectRatio:"none"
        },
            h("g", {
                    transform: `scale(${256/rangex},${-256/rangey}) translate(${-minx},${-miny-rangey})`
                },
                h("path", {
                    d: `${points.map((p, i)=> (i>0?"L":"M")+`${p[0]},${p[1]}`).join(" ")}`,
                    stroke: "white",
                    fill: "none",
                    strokeWidth: 1,
                    vectorEffect: "non-scaling-stroke"
                })
            )
        ),
        h("label", {}, 
            "Temperature",
            h("input", {
                type: "range", 
                min:1000, max: 10000,
                value: temperature,
                onChange: (e)=>setTemperature(e.target.value)
            }),
            `${temperature}K`
        ),
    );
}

export default BlackBody

