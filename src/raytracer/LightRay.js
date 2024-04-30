class Lightray
{
    constructor({origin, direction, intensity=0.5, wavelength=550}={})
    {
        this.origin = origin;
        this.direction = direction;
        this.intensity = intensity;
        this.wavelength = wavelength;
    }

    copy()
    {
        return new Lightray({
            origin: this.origin, 
            direction: this.direction, 
            intensity: this.intensity, 
            wavelength: this.wavelength
        });
    }

    toString()
    {
        return `Lightray(${this.origin}, ${this.direction}, ${this.intensity}, ${this.wavelength})`
    }
}

export default Lightray;