import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport-es6.js";
import GLViewport from "./components/GLViewport-es6.js";

import {Point, Vector, Ray, P, V, Circle, LineSegment, Rectangle} from "./geo-es6.js"
import {raytrace} from "./raytrace.js"

const h = React.createElement;
const App = ()=>{
    /* STATE */
    const [maxBounce, setMaxBounce] = React.useState(3);
    const [shapes, setShapes] = React.useState([
        new Circle(P(200, 120), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new Rectangle(P(700,700), 200,200),
        new LineSegment(P(200, 200), P(300, 130))
    ]);

    /* ANIMATION*/
    // React.useState(()=>{
    //     function animate(time)
    //     {
    //         requestAnimationFrame(animate);
    //         setShapes(shapes.map( (shape, i) => {
    //             if(i==0){
    //                 const pivot = P(250, 250)
    //                 const orbit_distance = 100;
    //                 const t = time*0.003;
    //                 return new Circle(P(Math.cos(t)*orbit_distance+pivot.x, Math.sin(t)*orbit_distance+pivot.y), shape.radius)
    //             }else{
    //                 return shape
    //             }
    //         }));
    //     }
    //     animate()
    // },[])

    const [viewBox, setViewBox] = React.useState({x:0,y:0,w:512,h:512});

    const [lights, setLights] = React.useState([
        P(50,50)
    ]);

    /* ACTIONS */
    function moveShape(shape, dx, dy)
    {
        const i = shapes.indexOf(shape);
        // dont mutate shapes state
        let new_shapes = shapes.map((s)=>s.copy());
        let new_shape = new_shapes[i];
        
        if(new_shape instanceof LineSegment){
            new_shape.p1.x+=dx;
            new_shape.p1.y+=dy;
            new_shape.p2.x+=dx;
            new_shape.p2.y+=dy;
        }else{
            new_shape.center.x+=dx
            new_shape.center.y+=dy;
        }

        setShapes(new_shapes);
    }

    function moveLight(light, dx, dy){
        const i = lights.indexOf(light);
        let new_lights = lights.map((l)=>light.copy());
        new_lights[i].x+=dx
        new_lights[i].y+=dy;
        setLights(new_lights);
    }

    /* RAYTRACE */
    // shoot rays from scene lights
    const count = 100;
    const angles = Array.from({length:count},(v,k)=>k/count*Math.PI*2)
    const rays = lights.map((light_pos)=>{
        return angles.map((a)=>{
            const x = Math.cos(a);
            const y = Math.sin(a);
            const dir = V(x,y);
            return new Ray(light_pos, dir.normalized(1000))
        })
    }).flat(1)

    let paths = rays.map((ray)=>[ray.origin])
    let current_rays = [...rays];
    let all_rays = [...current_rays]
    const path_count = rays.length
    for(let i=0; i<maxBounce; i++){
        let [secondary, intersections] = raytrace(current_rays, shapes);
        
        // const zipped = current_rays.map((ray, index)=>[rays[ index], secondary[index], paths[index]]);
        // for(let [ray, reflection, path] of zipped)
        // {
            
        // }
        
        for(let ray_index=0; ray_index<path_count; ray_index++)
        {
            const ray = current_rays[ray_index];
            const reflection = secondary[ray_index]
            const path = paths[ray_index]
            
            if(reflection != null){
                let p = reflection.origin
                path.push(p)
            }else if(ray != null){
                let dir = ray.direction.normalized(1000)
                let p = new Point(ray.origin.x+dir.x, ray.origin.y+dir.y)
                path.push(p)
            }
        }
        current_rays = secondary;
        all_rays = [...all_rays, ...secondary]
    }
    all_rays = all_rays.filter((ray)=>ray != null);

    return h("div", null,
        h("div", {id:"inspector"}, 
            h("section", null,
                h("table", null,
                    h("tr", null, 
                        h("td", null, "maxBounce"),
                        h("td", null, 
                            h("input", {type:"range", value:maxBounce, min: 0, max:16}, null),
                            `${maxBounce}`
                        ),
                    )
                )
            )
        ),
        h(GLViewport,  {
            scene: {shapes: shapes, paths:paths, lights:lights}, 
            viewBox: viewBox,
            className:"viewport"
        }),
        h(SVGViewport, {
            style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: {shapes: shapes, paths:paths, lights:lights}, 
            onShapeDrag: (shape, dx, dy)=>moveShape(shape, dx, dy),
            onLightDrag: (light, dx, dy)=>moveLight(light, dx, dy)
        })
        
    )
}
const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));