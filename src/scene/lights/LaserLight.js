import Light from "./Light.js"


class LaserLight extends Light
{
    constructor({Cx, Cy, angle=0, intensity=1.0, temperature=6500}={})
    {
        super({Cx, Cy, intensity, temperature});
        this.angle = angle;
    }

    copy()
    {
        return new LaserLight({
            Cx: this.Cx, 
            Cy: this.Cy, 
            angle: this.angle,
            temperature: this.temperature
        });
    }

    toString()
    {
        return `LaserLight(${this.Cx}, ${this.Cy}, ${this.angle.toFixed()})`
    }
}

export default LaserLight