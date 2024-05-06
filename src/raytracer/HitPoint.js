class HitPoint
{
     constructor({position, surfaceNormal, shape, material}={})
    {
        this.position = position;
        this.surfaceNormal = surfaceNormal;
        this.material = material;
    }

    copy()
    {
        return new HitPoint({
            position: this.position, 
            surfacenormal: this.surfaceNormal, 
            material: this.material
        });
    }

    toString(){
        return `HitPoint(${this.position}, ${this.surfaceNormal})`
    }
}

export default HitPoint;