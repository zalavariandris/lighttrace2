import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport-es6.js";
import GLViewport from "./components/GLViewport-es6.js";

import {Point, Vector, Ray, P, V, Circle, LineSegment, Rectangle} from "./geo.js"
import {makeRaysFromLights, intersect, raytrace, SamplingMethod} from "./raytrace.js"
import {sampleMirror, sampleTransparent, sampleDiffuse} from "./raytrace.js"

function transpose(array) {
    // Get the number of rows and columns
    const rows = array.length;
    const columns = array[0].length;

    // Transpose the array
    const transposedArray = Array.from({ length: columns }, (_, columnIndex) =>
        Array.from({ length: rows }, (_, rowIndex) => array[rowIndex][columnIndex])
    );

    return transposedArray;
}

function zip()
{
    var args = [].slice.call(arguments);
    var shortest = args.length==0 ? [] : args.reduce(function(a,b){
        return a.length<b.length ? a : b
    });

    return shortest.map(function(_,i){
        return args.map(function(array){return array[i]})
    });
}

function single_raytrace(rays, shapes, {tolerance})
{
    // secondary rays
    const intersections = intersect(rays, shapes, tolerance).map((intersection, i)=>{
        if(!intersection){
            return null
        }
        const distance = intersection.origin.distanceTo(rays[i].origin)
        return intersection
    })

    const secondaries = intersections.map((intersection, i)=>{
        if(intersection==null){
            return null;
        }else{
            const ray = rays[i]
            const secondary_direction = sampleMirror(ray.direction.normalized(1), intersection.direction.normalized(1));
            return new Ray(intersection.origin, secondary_direction)
        }
    })

    return [secondaries, intersections]
}

function raytrace2(lights, shapes, {maxBounce, samplingMethod, lightSamples})
{
    // initial rays
    const initial_rays = makeRaysFromLights(lights, lightSamples, samplingMethod);

    // raytrace steps
    let currentRays = initial_rays;
    const ray_steps = [initial_rays]
    const intersections_steps = []
    const paths = initial_rays.map(r=>[r.origin])
    for(let i=0; i<maxBounce; i++)
    {
        const [secondaries, intersections] = single_raytrace(currentRays, shapes, {tolerance:1e-6})
        for(let p=0; p<paths.length; p++)
        {
            if(intersections[p]){
                paths[p].push(intersections[p].origin)
            }else if(currentRays[p]){
                const ray = currentRays[p]
                paths[p].push(P(ray.origin.x+ray.direction.x*1000, ray.origin.y+ray.direction.y*1000))
            }
        }
        ray_steps.push(secondaries)
        intersections_steps.push(intersections)
        // allRays = [...allRays, ...secondaries]
        // allIntersections = [...allIntersections, ...intersections]
        currentRays = secondaries;
    }



    const allRays = ray_steps.flat(1)
    const allIntersections = intersections_steps.flat(1)
    return [
        allRays.filter(r=>r?true:false), 
        allIntersections.filter(i=>i?true:false),
        paths
    ]
}

const h = React.createElement;
const App = ()=>{
    /* STATE */
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Uniform
    })

    const [svgDisplayOptions, setSvgDisplayOptions] = React.useState({
        rays: true,
        intersections: true,
        lightpaths: true
    })

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });
    const [lights, setLights] = React.useState([
        P(430, 185)
    ]);
    const [shapes, setShapes] = React.useState([
        new Circle(P(230, 310), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new LineSegment(P(400, 250), P(500, 130)),
        new LineSegment(P(370, 220), P(470, 100)),
        new Rectangle(P(400,400), 100,100)
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

    const [rays, setRays] = React.useState([])
    const [paths, setPaths] = React.useState([])
    const [intersections, setIntersections] = React.useState([])

    // update_raytrace
    React.useEffect(()=>{
        const [new_rays, new_intersections, new_paths] = raytrace2(lights, shapes, {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: raytraceOptions.samplingMethod, 
            lightSamples: raytraceOptions.lightSamples
        });
        // set React state
        setRays(new_rays);
        setIntersections(new_intersections)
        setPaths(new_paths)
    })


    // const animRef = React.useRef()
    // function animate()
    // {
    //     console.log("animate", maxBounce)
    //     animRef.current = requestAnimationFrame(animate)
    //     /* RAYTRACE */  
    //     const [new_rays, new_intersections, new_paths] = raytrace2(lights, shapes, maxBounce)
        

    //     // set React state
    //     setRays(new_rays);
    //     // setIntersections(new_intersections)
    //     // setPaths(new_paths)
    // }
    // React.useEffect(()=>{
    //     cancelAnimationFrame(animRef.current)
    //     animate();
    // })
    // const paths = pathsRef.current;
    return h("div", null,
        // h(GLViewport,  {
        //     paths: paths,
        //     lights: lights,
        //     shapes: shapes,
        //     viewBox: viewBox,
        //     className:"viewport"
        // }),
        h(SVGViewport, {
            // style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: {
                lights: lights, 
                rays: svgDisplayOptions.rays?rays:[],
                shapes: shapes, 
                intersections: svgDisplayOptions.intersections?intersections:[], 
                paths:svgDisplayOptions.lightpaths?paths:[]}, 
            onShapeDrag: (shape, dx, dy)=>moveShape(shape, dx, dy),
            onLightDrag: (light, dx, dy)=>moveLight(light, dx, dy)
        }),
        h("div", {id:"inspector"}, 
            h("section", null,
                h("h2", null, "Raytrace otions"),
                h("table", null,
                    h("tr", null, 
                        h("td", null, "light samples"),
                        h("td", null, 
                            h("input", {
                                type:"range", 
                                value:raytraceOptions.lightSamples, 
                                onInput:(e)=>setRaytraceOptions({...raytraceOptions, ...{lightSamples: e.target.value}}),
                                min: 1, 
                                max:200}, 
                                null),
                            `${raytraceOptions.lightSamples}`
                        )
                    ),
                    h("tr", null, 
                        h("td", null, "max bounce"),
                        h("td", null, 
                            h("input", {type:"range", value:raytraceOptions.maxBounce, onInput:(e)=>setRaytraceOptions({...raytraceOptions, ...{maxBounce: e.target.value}}), min: 0, max:16}, null),
                            `${raytraceOptions.maxBounce}`
                        )
                    ),
                    h("tr", null,
                        h("td", null, "sampling method"),
                        h("td", null, 
                            h("input", {
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Random,
                                onChange: (e)=>setRaytraceOptions({...raytraceOptions, ...{samplingMethod: e.target.value}}),
                                id:SamplingMethod.Random, 
                                name: "sampling", 
                                type:"radio", 
                                value:SamplingMethod.Random}),
                            h("label", {for: SamplingMethod.Random}, SamplingMethod.Random),
                            h("input", {
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                                onChange: (e)=>setRaytraceOptions({...raytraceOptions, ...{samplingMethod: e.target.value}}),
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
                        h("td", null,"show svg intersections"),
                        h("td", null, h("input", {
                            checked: svgDisplayOptions.intersections, 
                            onChange: (e)=>setSvgDisplayOptions({...svgDisplayOptions, ...{intersections: e.target.checked}}),
                            type: "checkbox"}))
                    ),
                    h("tr", null,
                        h("td", null,"show svg rays"),
                        h("td", null, h("input", {
                            checked: svgDisplayOptions.rays, 
                            onChange: (e)=>setSvgDisplayOptions({...svgDisplayOptions, ...{rays: e.target.checked}}),
                            type: "checkbox"}))
                    ),
                    h("tr", null,
                        h("td", null,"show svg lightpaths"),
                        h("td", null, h("input", {
                            checked: svgDisplayOptions.lightpaths, 
                            onChange: (e)=>setSvgDisplayOptions({...svgDisplayOptions, ...{lightpaths: e.target.checked}}),
                            type: "checkbox"}))
                    )
                )
            ),
            h("section", null,
                h("h2", null, "Scene info"),
                h("div", null, `rays: ${rays.length}`),
                h("div", null, `intersections: ${intersections.length}`),
                h("ul", null, 
                    ...intersections.map((intersection)=>{
                        return h("li", null, `${intersection}`)
                    })
                ),
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