import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport-es6.js";
import GLViewport from "./components/GLViewport-es6.js";

import {Point, Vector, Ray, P, V} from "./geo.js"
import {Shape, Circle, LineSegment, Rectangle} from "./scene.js"
import {Light, PointLight } from "./scene.js";
import {makeRaysFromLights, raytrace, intersect, SamplingMethod} from "./raytrace.js"
import {sampleMirror, sampleTransparent, sampleDiffuse} from "./raytrace.js"

const h = React.createElement;

const App = ()=>{
    /* STATE */
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Uniform
    })
    const updateRaytraceOptions = options=>setRaytraceOptions({...raytraceOptions, ...options})

    const [svgDisplayOptions, setSvgDisplayOptions] = React.useState({
        rays: true,
        intersections: true,
        lightpaths: true
    })
    const updateSvgDisplayOptions = options=> setSvgDisplayOptions({...svgDisplayOptions, ...options})

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    const [scene, setScene] = React.useState([
        new PointLight(P(430, 185)),
        new Circle(P(230, 310), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new LineSegment(P(400, 250), P(500, 130)),
        new LineSegment(P(370, 220), P(470, 100)),
        new Rectangle(P(400,400), 100,100)
    ]);
    const updateSceneObject = (index, newObject)=>setScene(scene.toSpliced(index, 1, newObject))

    // computed
    const [rays, setRays] = React.useState([])
    const [paths, setPaths] = React.useState([])
    const [intersections, setIntersections] = React.useState([])

    /* ACTIONS */
    function moveSceneObject(sceneObject, dx, dy)
    {
        const newObject = sceneObject.copy()
        if(newObject instanceof LineSegment){
            newObject.p1.x+=dx;
            newObject.p1.y+=dy;
            newObject.p2.x+=dx;
            newObject.p2.y+=dy;
        }else{
            newObject.center.x+=dx
            newObject.center.y+=dy;
        }

        const idx = scene.indexOf(sceneObject);
        updateSceneObject(idx, newObject)
    }

    // update_raytrace
    function updateRaytrace()
    {
        const lights = scene.filter(obj=>obj instanceof Light)
        const shapes = scene.filter(obj=>obj instanceof Shape)
        const [new_rays, new_intersections, new_paths] = raytrace(lights, shapes, {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: raytraceOptions.samplingMethod, 
            lightSamples: raytraceOptions.lightSamples
        });
        // set React state
        setRays(new_rays);
        setIntersections(new_intersections)
        setPaths(new_paths)
    }

    React.useEffect(()=>{
        updateRaytrace()
    })

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
            scene: scene,
            rays: svgDisplayOptions.rays?rays:[],
            intersections: svgDisplayOptions.intersections?intersections:[], 
            paths:svgDisplayOptions.lightpaths?paths:[], 
            onShapeDrag: (shape, dx, dy)=>moveSceneObject(shape, dx, dy),
            onLightDrag: (light, dx, dy)=>moveSceneObject(light, dx, dy)
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
                                onInput:(e)=>updateRaytraceOptions({lightSamples: e.target.value}),
                                min: 1, 
                                max:200}, 
                                null),
                            `${raytraceOptions.lightSamples}`
                        )
                    ),
                    h("tr", null, 
                        h("td", null, "max bounce"),
                        h("td", null, 
                            h("input", {
                                type:"range", 
                                value:raytraceOptions.maxBounce, 
                                onInput:(e)=>updateRaytraceOptions({maxBounce: e.target.value}), 
                                min: 0, 
                                max:16
                            }, null),
                            `${raytraceOptions.maxBounce}`
                        )
                    ),
                    h("tr", null,
                        h("td", null, "sampling method"),
                        h("td", null, 
                            h("input", {
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Random,
                                onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                                id:SamplingMethod.Random, 
                                name: "sampling", 
                                type:"radio", 
                                value:SamplingMethod.Random}),
                            h("label", {for: SamplingMethod.Random}, SamplingMethod.Random),
                            h("input", {
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                                onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
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
                            onChange: (e)=>updateSvgDisplayOptions({intersections: e.target.checked}),
                            type: "checkbox"}))
                    ),
                    h("tr", null,
                        h("td", null,"show svg rays"),
                        h("td", null, h("input", {
                            checked: svgDisplayOptions.rays, 
                            onChange: (e)=>updateSvgDisplayOptions({rays: e.target.checked}),
                            type: "checkbox"}))
                    ),
                    h("tr", null,
                        h("td", null,"show svg lightpaths"),
                        h("td", null, h("input", {
                            checked: svgDisplayOptions.lightpaths, 
                            onChange: (e)=>updateSvgDisplayOptions({lightpaths: e.target.checked}),
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
                h("h3", null, "scene"),
                h("ul", null,
                    scene.map((obj)=>{
                        return h("li", null, `${obj}`);
                    })
                )
            )
        ),
        
    )
}
const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));