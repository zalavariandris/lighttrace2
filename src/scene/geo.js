// Define an epsilon value
class Point
{
    constructor(x,y)
    {
        this.x=x; this.y=y;
    }

    copy()
    {
        return new Point(this.x, this.y)
    }

    distanceTo(p)
    {
        const dx = this.x-p.x;
        const dy = this.y-p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distanceTo2(p)
    {
        const dx = this.x-p.x;
        const dy = this.y-p.y;
        return dx * dx + dy * dy;
    }
    
    toString()
    {
        return `Point(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`
    }
}

class Vector
{
    constructor(x,y)
    {
        this.x=x; 
        this.y=y;
    }

    toString()
    {
        return `Vector(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`
    }

    copy()
    {
        return new Point(this.x, this.y)
    }

    dotProduct(vector)
    {
        return this.x * vector.x + this.y * vector.y;
    }
    
    magnitude()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    magnitude2()
    {
        return this.x * this.x + this.y * this.y;
    }

    rotate(angleRadians)
    {
        // Extract vector components
        let x = this[0];
        let y = this[1];
        
        // Perform rotation
        let newX = this.x * Math.cos(angleRadians) - this.y * Math.sin(angleRadians);
        let newY = this.x * Math.sin(angleRadians) + this.y * Math.cos(angleRadians);
        
        return new Vector(newX, newY);
    }

    angleToYAxis()
    {
        return Math.acos(this.y / this.magnitude());
    }

    angleToXAxis(vector)
    {
        let magnitude = Math.sqrt(this.x**2 + this.y**2);
        return Math.acos(this.x / this.magnitude());
    }

    add(other)
    {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    subtract(other)
    {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    negate()
    {
        return new Vector(-this.x, -this.y)
    }

    multiply(value)
    {
        return new Vector(this.x * value, this.y * value);
    }

    reflect(normal) {
        const dotProduct = this.dotProduct(normal);
        return new Vector(
            this.x - 2 * dotProduct * normal.x,
            this.y - 2 * dotProduct * normal.y
        );
    }
    
    normalized(value=1.0)
    {
        const magnitude = this.magnitude();
        return new Vector(this.x / magnitude * value, this.y / magnitude*value);
    }
}


function P(x,y){return new Point(x,y)}
function V(x,y){return new Vector(x,y)}

export {Point, Vector}
export {P, V}