class HitPoint
{
     constructor({position, surfaceNormal, shape}={})
    {
        this.position = position;
        this.surfaceNormal = surfaceNormal;
        this.shape = shape;
    }

    copy()
    {
        return new HitPoint({
            position: this.position, 
            surfacenormal: this.surfaceNormal, 
            shape: this.shape
        });
    }

    toString(){
        return `HitPoint(${this.position}, ${this.surfaceNormal})`
    }
}

export default HitPoint;