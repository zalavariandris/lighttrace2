import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport.js";
import GLViewport from "./components/GLViewport.js";

import {Point, Vector, Ray, P, V} from "./geo.js"
import {Geometry, Circle, LineSegment, Rectangle, Lens} from "./scene.js"
import {Light, PointLight, LaserLight, DirectonalLight} from "./scene.js";
import {makeRaysFromLights, raytrace, SamplingMethod} from "./raytrace.js"
import {Material, MirrorMaterial, TransparentMaterial, DiffuseMaterial} from "./scene.js"

const h = React.createElement;


const Form = (params)=>{
    const keys = Object.keys(params)
    return h("form", null, alph)
}

const App = ()=>{
    /* STATE */
    const [raytraceTick, setRaytraceTick] = React.useState(0)
    const [showSettings, setShowSettings] = React.useState(true)
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Uniform
    })
    const updateRaytraceOptions = options=>setRaytraceOptions({...raytraceOptions, ...options})

    const [svgDisplayOptions, setSvgDisplayOptions] = React.useState({
        rays: false,
        intersections: false,
        lightpaths: true
    })
    const updateSvgDisplayOptions = options=> setSvgDisplayOptions({...svgDisplayOptions, ...options})

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    const [scene, setScene] = React.useState([
        new PointLight(P(430, 185)),
        new LaserLight(P(150,220), 0),
        new DirectonalLight(P(150,180), 20,0),
        new Lens(P(300, 100),  new TransparentMaterial(), 20, 100, 100, 100), 
        new Circle(P(230, 310), new TransparentMaterial(), 50),
        // new Circle(P(520, 550), 100),
        // new Circle(P(120, 380), 80),
        new LineSegment(P(400, 250), P(500, 130), new MirrorMaterial()),
        new LineSegment(P(370, 220), P(470, 100), new MirrorMaterial()),
        new Rectangle(P(400,400), new MirrorMaterial(), 100,100)
    ]);
    const [selection, setSelection] = React.useState([])
    const updateSceneObject = (oldObject, newObject)=>{
        const sceneIdx = scene.indexOf(oldObject)
        const newScene = scene.toSpliced(sceneIdx, 1, newObject)
        const newSelection = selection.map(oldObject=>newScene[scene.indexOf(oldObject)])

        setScene(newScene)
        setSelection(newSelection)
    }

    // update_raytrace
    const lights = scene.filter(obj=>obj instanceof Light)
    const shapes = scene.filter(obj=>obj instanceof Geometry)
    const [newRays, newIntersections, newPaths] = raytrace(lights, [shapes, shapes.map(shp=>shp.material)], {
        maxBounce:raytraceOptions.maxBounce, 
        samplingMethod: raytraceOptions.samplingMethod, 
        lightSamples: raytraceOptions.lightSamples
    });
    // set React state
    const rays = newRays;
    const intersections = newIntersections;
    const paths = newPaths;

    // step rayrace on animation frame
    const [count, setCount] = React.useState(0);
    const requestRef = React.useRef();
    const previousTimeRef = React.useRef();

    // const animate = time => {
    //     // if (previousTimeRef.current != undefined) {
    //     setCount(prevCount => prevCount + 1);
    //     // }
    //     // previousTimeRef.current = time;
    //     requestRef.current = requestAnimationFrame(animate);
    //   }
      
    //   React.useEffect(() => {
    //     requestRef.current = requestAnimationFrame(animate);
    //     return () => cancelAnimationFrame(requestRef.current);
    //   }, []); // Make sure the effect runs only once

    return h("div", null,
        // h(GLViewport,  {
        //     paths: paths,
        //     lights: lights,
        //     shapes: shapes,
        //     viewBox: viewBox,
        //     className:"viewport"
        // }),
        h("span", null, `tick: ${count}`),
        h(SVGViewport, {
            // style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: scene,
            selection:selection,
            onSelection: (newSelection)=>setSelection(newSelection),
            rays: svgDisplayOptions.rays?rays:[],
            intersections: svgDisplayOptions.intersections?intersections:[], 
            paths:svgDisplayOptions.lightpaths?paths:[], 
            onSceneObject: (oldObject, newObject)=>updateSceneObject(oldObject, newObject)
        }),        
        h("div", {id:"inspector"}, 
            h('label', {for: "showSettingstoggle", style: {fontSize: "32px"}}, "⚙"),
            h('input', {
                id:"showSettingsToggle",
                type: "checkbox", 
                checked: showSettings, 
                onChange:()=>setShowSettings(!showSettings)
            }),
            h('div', {style: {display: showSettings?"block":"none"}}, 
                h("section", null,
                    h("h2", null, "Raytrace otions"),
                    h("table", null,
                        h("tr", null, 
                            h("td", null, "light samples"),
                            h("td", null, 
                                h("input", {
                                    type:"range", 
                                    name: "light samples",
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
                                    name: "max bounce",
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
                                    name: "sampling", 
                                    checked: raytraceOptions.samplingMethod == SamplingMethod.Random,
                                    onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                                    id:SamplingMethod.Random, 
                                    type:"radio", 
                                    value:SamplingMethod.Random}),
                                h("label", {for: SamplingMethod.Random}, SamplingMethod.Random),
                                h("input", {
                                    name: "sampling",
                                    checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                                    onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                                    id: SamplingMethod.Uniform,
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
                            h("td", null,"show svg rays"),
                            h("td", null, h("input", {
                                name:"show svg rays",
                                checked: svgDisplayOptions.rays, 
                                onChange: (e)=>updateSvgDisplayOptions({rays: e.target.checked}),
                                type: "checkbox"
                            }))
                        ),
                        h("tr", null,
                            h("td", null,"show svg intersections"),
                            h("td", null, h("input", {
                                name: "show svg intersections",
                                checked: svgDisplayOptions.intersections, 
                                onChange: (e)=>updateSvgDisplayOptions({intersections: e.target.checked}),
                                type: "checkbox"
                            }))
                        ),
                        h("tr", null,
                            h("td", null,"show svg lightpaths"),
                            h("td", null, h("input", {
                                name: "show svg lightpaths",
                                checked: svgDisplayOptions.lightpaths, 
                                onChange: (e)=>updateSvgDisplayOptions({lightpaths: e.target.checked}),
                                type: "checkbox"
                            }))
                        )
                    )
                ),
                h("section", null,
                    h("h2", null, "Scene info"),
                    h("h3", null, "Objects"),
                    h("ul", null, 
                        ...scene.map((sceneObject)=>{
                            return h("li", {style: {fontStyle: selection.indexOf(sceneObject)>=0?"italic":"normal"}}, `${sceneObject} ${selection.indexOf(sceneObject)}`)
                        })
                    ),
                    h("div", null, `rays: ${rays.length}`),
                    h("div", null, `intersections: ${intersections.length}`),

                    h("ul", null, 
                        ...intersections.map((intersection)=>{
                            return h("li", null, `${intersection}`)
                        })
                    ),
                    h("h3", null, "Scene"),
                    h("ul", null,
                        scene.map((obj)=>{
                            return h("li", null, `${obj}`);
                        })
                    )
                )
            )
        )
    )
}
const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));