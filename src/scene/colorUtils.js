import colorSpectrum from 'https://cdn.jsdelivr.net/npm/color-spectrum@1.1.3/+esm'
window.colorSpectrum = colorSpectrum;

function wavelengthToRGB(wavelength)
{
    /*
    credits: https://academo.org/demos/wavelength-to-colour-relationship/
    https://codepen.io/pen?editors=0110
    */
    var Gamma = 0.80,
    IntensityMax = 1.0,
    factor, red, green, blue;
    if((wavelength >= 380) && (wavelength<440)){
        red = -(wavelength - 440) / (440 - 380);
        green = 0.0;
        blue = 1.0;
    }else if((wavelength >= 440) && (wavelength<490)){
        red = 0.0;
        green = (wavelength - 440) / (490 - 440);
        blue = 1.0;
    }else if((wavelength >= 490) && (wavelength<510)){
        red = 0.0;
        green = 1.0;
        blue = -(wavelength - 510) / (510 - 490);
    }else if((wavelength >= 510) && (wavelength<580)){
        red = (wavelength - 510) / (580 - 510);
        green = 1.0;
        blue = 0.0;
    }else if((wavelength >= 580) && (wavelength<645)){
        red = 1.0;
        green = -(wavelength - 645) / (645 - 580);
        blue = 0.0;
    }else if((wavelength >= 645) && (wavelength<781)){
        red = 1.0;
        green = 0.0;
        blue = 0.0;
    }else{
        red = 0.0;
        green = 0.0;
        blue = 0.0;
    };
    // Let the intensity fall off near the vision limits
    if((wavelength >= 380) && (wavelength<420)){
        factor = 0.3 + 0.7*(wavelength - 380) / (420 - 380);
    }else if((wavelength >= 420) && (wavelength<701)){
        factor = 1.0;
    }else if((wavelength >= 701) && (wavelength<781)){
        factor = 0.3 + 0.7*(780 - wavelength) / (780 - 700);
    }else{
        factor = 0.0;
    };
    if (red !== 0){
        red = Math.round(IntensityMax * Math.pow(red * factor, Gamma));
    }
    if (green !== 0){
        green = Math.round(IntensityMax * Math.pow(green * factor, Gamma));
    }
    if (blue !== 0){
        blue = Math.round(IntensityMax * Math.pow(blue * factor, Gamma));
    }
    return [red,green,blue];
}

/**
 * Estimates the RGB color from a given temperature in Kelvin, in a linear color space within the [0,1] range.
 * This function uses the approximation of the Planckian locus in RGB color space.
 * 
 * @param {number} temperature - The temperature in Kelvin.
 * @returns {Array} An array containing the linear RGB values.
 */
function temperatureToRGB(temperature) {
    // Normalize temperature
    const kelvin = temperature / 100.0;
    let red, green, blue;

    // Calculate red
    if (kelvin <= 66.0) {
        red = 1.0;
    } else {
        red = kelvin - 60.0;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        red = red / 255.0;
    }

    // Calculate green
    if (kelvin <= 66.0) {
        green = kelvin;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;
        green = green / 255.0;
    } else {
        green = kelvin - 60.0;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);
        green = green / 255.0;
    }

    // Calculate blue
    if (kelvin >= 66.0) {
        blue = 1.0;
    } else if (kelvin <= 19.0) {
        blue = 0.0;
    } else {
        blue = kelvin - 10.0;
        blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        blue = blue / 255.0;
    }

    return [red, green, blue];
}



function RGBToCSS([R,G,B], opacity=1.0){
    return `rgba(${(R*255).toFixed(0)}, ${(G*255).toFixed(0)}, ${(B*255).toFixed(0)}, ${opacity})`;
}

export {RGBToCSS, wavelengthToRGB, temperatureToRGB}