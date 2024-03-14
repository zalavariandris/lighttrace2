import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport-es6.js";
import GLViewport from "./components/GLViewport-es6.js";

import {Point, Vector, Ray, P, V, Circle, LineSegment, Rectangle} from "./geo-es6.js"
import {trace_rays} from "./raytrace.js"

const SamplingMethod = Object.freeze({
    Random: "Random",
    Uniform: "Uniform"
})

function raytrace(lights, shapes, options={maxBounce:3, sampling:SamplingMethod.Random, lightSamples:50})
{
    console.log(options.maxBounce)
    // shoot rays from scene lights
    const uniform_angles = Array.from({length:options.lightSamples},(v,k)=>{
        return k/options.lightSamples*Math.PI*2
    });
    const random_angles = Array.from({length:options.lightSamples},(v,k)=>{
        return Math.random()*Math.PI*2;
    });
    const angles = options.sampling==SamplingMethod.Random ? random_angles : uniform_angles
    const rays = angles.map((a)=>{
        return lights.map((light_pos)=>{
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
    for(let i=0; i<options.maxBounce; i++){
        let [secondary, intersections] = trace_rays(current_rays, shapes);
        
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
    return paths;
}


const h = React.createElement;
const App = ()=>{
    /* STATE */
    const [maxBounce, setMaxBounce] = React.useState(3);
    const [lightSamples, setLightSamples] = React.useState(150);
    const [samplingMethod, setSamplingMethod] = React.useState(SamplingMethod.Random);
    const [showSVGlightpaths, setShowSVGlightpaths] = React.useState(false);
    
    const [shapes, setShapes] = React.useState([
        new Circle(P(250, 320), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new Rectangle(P(500,500), 200,200),
        new LineSegment(P(400, 200), P(500, 130))
    ]);
    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });
    const [lights, setLights] = React.useState([
        P(300,100)
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

    const [paths, setPaths] = React.useState([])

    // const pathsRef = React.useRef([])

    const animRef = React.useRef()
    function animate()
    {
        animRef.current = requestAnimationFrame(animate)
        const new_paths = raytrace(lights, shapes, {maxBounce:maxBounce, sampling:samplingMethod, lightSamples:lightSamples});
        setPaths(new_paths)
        //  pathsRef.current = raytrace(lights, shapes, maxBounce);
        // console.log("animate")
    }
    React.useEffect(()=>{
        cancelAnimationFrame(animRef.current)
        animate();
    })
    // const paths = pathsRef.current;
    return h("div", null,
        h(GLViewport,  {
            paths: paths,
            lights: lights,
            shapes: shapes,
            viewBox: viewBox,
            className:"viewport"
        }),
        h(SVGViewport, {
            // style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: {shapes: shapes, paths:showSVGlightpaths?paths:[], lights:lights}, 
            onShapeDrag: (shape, dx, dy)=>moveShape(shape, dx, dy),
            onLightDrag: (light, dx, dy)=>moveLight(light, dx, dy)
        }),
        h("div", {id:"inspector"}, 
            h("section", null,
                h("h2", null, "Raytrace otions"),
                h("table", null,
                    h("tr", null, 
                        h("td", null, "sample per light"),
                        h("td", null, 
                            h("input", {
                                type:"range", 
                                value:lightSamples, 
                                onInput:(e)=>setLightSamples(e.target.value), 
                                min: 1, 
                                max:5000}, 
                                null),
                            `${lightSamples}`
                        )
                    ),
                    h("tr", null, 
                        h("td", null, "max bounce"),
                        h("td", null, 
                            h("input", {type:"range", value:maxBounce, onInput:(e)=>setMaxBounce(e.target.value), min: 0, max:16}, null),
                            `${maxBounce}`
                        )
                    ),
                    h("tr", null,
                        h("td", null, "sampling method"),
                        h("td", null, 
                            h("input", {
                                checked: samplingMethod == SamplingMethod.Random,
                                onChange: (e)=>setSamplingMethod(e.target.value),
                                id:SamplingMethod.Random, 
                                name: "sampling", 
                                type:"radio", 
                                value:SamplingMethod.Random}),
                            h("label", {for: SamplingMethod.Random}, SamplingMethod.Random),
                            h("input", {
                                checked: samplingMethod == SamplingMethod.Uniform,
                                onChange: (e)=>setSamplingMethod(e.target.value),
                                id: SamplingMethod.Uniform,
                                name: "sampling",
                                type:"radio",
                                value:SamplingMethod.Uniform}),
                            h("label", {for: SamplingMethod.Uniform}, SamplingMethod.Uniform)
                        )
                    )
                )
            ),
            h("section", null,
                h("h2", null, "Display options"),
                h("table", null,
                    h("tr", null,
                        h("td", null,"show svg lightpaths"),
                        h("td", null, h("input", {
                            checked: showSVGlightpaths, 
                            onChange: (e)=>setShowSVGlightpaths(e.target.checked),
                            type: "checkbox"}))
                    )
                )
            ),
            h("section", null,
                h("h2", null, "Scene info"),
                h("h3", null, "lights"),
                h("ul", null,
                    lights.map((light)=>{
                        return h("li", null, `Light ${light.x.toFixed(1)},${light.y.toFixed(1)}`)
                    })
                ),
                h("h3", null, "shapes"),
                h("ul", null,
                    shapes.map((shape)=>{
                        return h("li", null, `${shape}`);
                    })
                )
            )
        ),
        
    )
}
const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));