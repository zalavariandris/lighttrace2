import {Point, Vector, Ray, P, V, Circle, LineSegment, Rectangle} from "./geo-es6.js"
function raytrace(rays, shapes){
    // find intersections
    let intersections = []
    let secondaries = []
    for(let primary of rays)
    {
        if(primary == null){
            secondaries = [...secondaries, ...[null]]
            continue;
        }
        
        let ray_intersections = [];
        for(let shape of shapes)
        {
            let shape_intersections = []
            
            if(shape instanceof Circle){
                shape_intersections = [...shape_intersections, ...primary.intersectCircle(shape)];
            } 
            else if(shape instanceof Rectangle){
                shape_intersections = [...shape_intersections, ...primary.intersectRectangle(shape)];
            } else if(shape instanceof LineSegment){
                shape_intersections = [...shape_intersections, ...primary.intersectLineSegment(shape)];
            } 
            ray_intersections = [...ray_intersections, ...shape_intersections];
            
        }
        
        if(ray_intersections.length>0)
        {
            // find closest interseciont
            let closest = ray_intersections.reduce((a, b) => primary.origin.distance(a.origin) < primary.origin.distance(b.origin) ? a : b);
            ray_intersections.push(closest)
            
            // reflect ray on intersection
            const reflected_rays = [closest].map((i)=>{
                const secondary_dir = primary.direction.reflect(i.direction)
                return new Ray(i.origin, secondary_dir.normalized(100));
            });
            
            secondaries = [...secondaries, ...reflected_rays]
        }else[
            secondaries = [...secondaries, ...[null]]
        ]
    }
    
    // intersections
    return [secondaries, intersections];
}

export {raytrace}