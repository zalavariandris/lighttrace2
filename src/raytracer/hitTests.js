
import {Point, Vector, P, V} from "../scene/geo.js"
import LineSegment from "../scene/shapes/LineSegment.js";
import HitPoint from "./HitPoint.js";
const EPSILON=1e-6;

function hitShape(ray, shape, {DISTANCE_THRESHOLD})
{
    switch (shape.constructor.name) {
        case "Circle":
            return hitCircle(ray, shape, {DISTANCE_THRESHOLD});
        case "Rectangle":
            return hitRectangle(ray, shape, {DISTANCE_THRESHOLD});
        case "SphericalLens":
            return hitSphericalLens(ray, shape, {DISTANCE_THRESHOLD});
        case "LineSegment":
            return hitLineSegment(ray, shape, {DISTANCE_THRESHOLD});
        default:
            return null;
    }
}

/* HIT TESTS */
function hitCircle(ray, circle, {DISTANCE_THRESHOLD})
{
    // solve quadratic equatation: at**2+bt+c=0
    const d = new Vector(ray.origin.x - circle.Cx, ray.origin.y - circle.Cy); // to circle
    const a = ray.direction.dotProduct(ray.direction);
    const b = 2 * ray.direction.dotProduct(d);
    const c = d.dotProduct(d) - circle.radius * circle.radius;
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0)
    {
        return null;
    }
    
    // calc the distance along the ray (parameter of intersection points)
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    let t=-1;
    if(t1>0 && t2>0)
    {
        t = Math.min(t1, t2)
    }
    else if(t1>0)
    {
        t = t1
    }
    else if(t2>0)
    {
        t = t2
    }
    else
    {
        return null
    }

    // map distance alng ray to hitpoints
    const hitPoints = [t1, t2].filter(t=>t>EPSILON).map( t => {
        const hitPosition = P(ray.origin.x + t * ray.direction.x, ray.origin.y + t * ray.direction.y);
        const surfaceNormal = V(hitPosition.x - circle.Cx, hitPosition.y - circle.Cy).normalized();
        
        return new HitPoint({
            position: hitPosition, 
            surfaceNormal: surfaceNormal,
            shape: circle
        });
    });

    // filter hitPoints by distance treshold
    const DISTANCE_THRESHOLD_SQUARED = DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;
    const filteredHitPoints = hitPoints.filter(hitPoint => {
        const dx = hitPoint.position.x - ray.origin.x;
        const dy = hitPoint.position.y - ray.origin.y;
        const distanceSquared = dx * dx + dy * dy;
        return distanceSquared >= DISTANCE_THRESHOLD_SQUARED;
    });

    // get closest hitpoint
    return reduceHitpointsToClosest(filteredHitPoints, ray.origin);
}

function hitLineSegment(ray, shape, {DISTANCE_THRESHOLD})
{
    const rayOrigin = ray.origin;
    const rayDirection = ray.direction.normalized();
    const lineSegmentP1 = new Point(shape.Ax, shape.Ay);
    const lineSegmentP2 = new Point(shape.Bx, shape.By);
    
    // Calculate the direction vector of the line segment
    const lineSegmentDirection = new Vector(
        lineSegmentP2.x - lineSegmentP1.x,
        lineSegmentP2.y - lineSegmentP1.y,
    );
    
    // Calculate the determinant
    const determinant = rayDirection.x * lineSegmentDirection.y - rayDirection.y * lineSegmentDirection.x;

    // If the determinant is close to zero, the lines are parallel
    if (Math.abs(determinant) < EPSILON) {
        return null;
    }
    
    
    // Calculate the intersection along the ray
    const t1 = ((lineSegmentP1.x - rayOrigin.x) * lineSegmentDirection.y - (lineSegmentP1.y - rayOrigin.y) * lineSegmentDirection.x) / determinant;
    const t2 = ((lineSegmentP1.x - rayOrigin.x) * rayDirection.y - (lineSegmentP1.y - rayOrigin.y) * rayDirection.x) / determinant;
    
    const IntersectionWithinRay = t1>0 && t1<Infinity;
    const IntersectinWithinLinesegment = t2>0 && t2<1.0;

    if(IntersectionWithinRay && IntersectinWithinLinesegment)
    {
        const hitPosition = P(
            rayOrigin.x + t1 * rayDirection.x,
            rayOrigin.y + t1 * rayDirection.y,
        );

        // Calculate the line normal
        const V = new Vector(lineSegmentP1.x - lineSegmentP2.x, lineSegmentP1.y - lineSegmentP2.y);
        let N = new Vector(V.y, -V.x).normalized(1); // perpendicular to V

        return new HitPoint({
            position: hitPosition, 
            surfaceNormal: N.negate(),
            shape: shape
        });
    }
    else
    {
        return null;
    }
}

function hitRectangle(ray, shape, {DISTANCE_THRESHOLD})
{
    const top =    shape.Cy - shape.height/2;
    const left =   shape.Cx - shape.width/2;
    const bottom = shape.Cy + shape.height/2;
    const right =  shape.Cx + shape.width/2;
    
    const sides = [
        new LineSegment({Ax:right, Ay: top, Bx:left, By:top}), //top
        new LineSegment({Bx:right, By: top, Ax:right, Ay:bottom}), //right
        new LineSegment({Ax:left, Ay: bottom, Bx:right, By:bottom}), //bottom
        new LineSegment({Ax:left, Ay: top, Bx:left, By:bottom}) // keft
    ];
    
    // merge all

    const hitPoints = sides.map( side=>hitLineSegment(ray, side, {DISTANCE_THRESHOLD})).filter(hitPoint=>hitPoint!==null);

    // filter hitPoints by distance treshold
    const DISTANCE_THRESHOLD_SQUARED = DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;
    const filteredHitPoints = hitPoints.filter(hitPoint => {
        const dx = hitPoint.position.x - ray.origin.x;
        const dy = hitPoint.position.y - ray.origin.y;
        const distanceSquared = dx * dx + dy * dy;
        return distanceSquared >= DISTANCE_THRESHOLD_SQUARED;
    });

    // get closest hitpoint
    return reduceHitpointsToClosest(filteredHitPoints, ray.origin);
}

function hitSphericalLens(ray, lens, {DISTANCE_THRESHOLD})
{
    // create compound shapes
    const leftCircle = lens.getLeftCircle();
    leftCircle.material = lens.material;
    const rightCircle = lens.getRightCircle();
    rightCircle.material = lens.material;

    const Cx = lens.Cx;
    const Cy = lens.Cy
    const topLeft =  P(Cx - lens.edgeThickness/2, Cy+lens.diameter/2)
    const topRight = P(Cx + lens.edgeThickness/2, Cy+lens.diameter/2)
    const bottomLeft =  P(Cx - lens.edgeThickness/2, Cy+-lens.diameter/2)
    const bottomRight = P(Cx + lens.edgeThickness/2, Cy+-lens.diameter/2)

    const topSide = new LineSegment(topLeft, topRight);
    const bottomSide = new LineSegment(bottomLeft, bottomRight);

    // calc all possible hits
    const leftCircleHitPoint = hitCircle(ray, leftCircle, {DISTANCE_THRESHOLD});
    const rightCircleHitPoint = hitCircle(ray, rightCircle, {DISTANCE_THRESHOLD});
    if(lens.centerThickness<lens.edgeThickness)
    {
        for(let hitPoint of leftCircleHitPoints)
        {
            hitPoint.surfaceNormal = hitPoint.surfaceNormal.negate()
        }
        for(let hitPoint of rightCircleHitPoints)
        {
            hitPoint.surfaceNormal = hitPoint.surfaceNormal.negate()
        }
    }
    const hitPoints = [
        leftCircleHitPoint,
        rightCircleHitPoint,
        hitLineSegment(ray, topSide, {DISTANCE_THRESHOLD}),
        hitLineSegment(ray, bottomSide, {DISTANCE_THRESHOLD})
    ].filter(hitPoint=>hitPoint!==null);

    // filter to bbox
    const {top, bottom, left, right} = lens.bbox();

    // filter hitPoints to bounding box;
    const hitPointsInBBox = hitPoints.filter((hitPoint)=>{
        const Ix = hitPoint.position.x;
        const Iy = hitPoint.position.y;
        return right+1>Ix && left-1 < Ix && Iy>bottom-1 && Iy<top+1;
    });

    // filter hitPoints by distance treshold
    const DISTANCE_THRESHOLD_SQUARED = DISTANCE_THRESHOLD * DISTANCE_THRESHOLD;
    const filteredHitPoints = hitPointsInBBox.filter(hitPoint => {
        const dx = hitPoint.position.x - ray.origin.x;
        const dy = hitPoint.position.y - ray.origin.y;
        const distanceSquared = dx * dx + dy * dy;
        return distanceSquared > DISTANCE_THRESHOLD_SQUARED;
    });

    // get closest hitpoint
    return reduceHitpointsToClosest(filteredHitPoints, ray.origin);
}

function hitScene(ray, shapes, {DISTANCE_THRESHOLD})
{
    const hitPoints = shapes.map( shape=> hitShape(ray, shape, {DISTANCE_THRESHOLD}));
        // get closest hitpoint
    return reduceHitpointsToClosest(hitPoints, ray.origin)
}

function reduceHitpointsToClosest(hitPoints, rayOrigin)
{
    const closestHitPoint = hitPoints.reduce((closest, current) => {
        if (!closest) return current;
        if (!current) return closest;
        const closestDistanceSquared = Math.pow(closest.position.x - rayOrigin.x, 2) + Math.pow(closest.position.y - rayOrigin.y, 2);
        const currentDistanceSquared = Math.pow(current.position.x - rayOrigin.x, 2) + Math.pow(current.position.y - rayOrigin.y, 2);
        return currentDistanceSquared < closestDistanceSquared ? current : closest;
    }, null);
    return closestHitPoint;
}

export {HitPoint};
export {hitShape, hitScene, reduceHitpointsToClosest};