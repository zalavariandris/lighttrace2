import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport.js";
import GLViewport from "./components/GLViewport.js";
import Collapsable from "./components/Collapsable.js";
import {Point, Vector, Ray, P, V} from "./geo.js"
import {Geometry, Circle, LineSegment, Rectangle, Lens} from "./scene.js"
import {Light, PointLight, LaserLight, DirectonalLight} from "./scene.js";
import {Lightray, makeRaysFromLights, raytrace, SamplingMethod} from "./raytrace.js"
import {Material, MirrorMaterial, TransparentMaterial, DiffuseMaterial} from "./scene.js"

const h = React.createElement;

const RaytraceStats = ({
    scene=[],
    lightRays=[],
    hitPoints=[],
    lightPaths=[]
}={})=>{
    return h("section", null, 
        h("h3", null, "RaytraceStats"),

        h(Collapsable, {title: `Scene №${scene.length}`}, 
            h("ul", null, 
                scene.map(item=>{
                    return h('li', null, `${item}`)
                })
            )
        ),
        h(Collapsable, {title: `Lightrays №${lightRays.length}`}, 
            h("ul", null, 
                lightRays.map(item=>{
                    return h('li', null, `${item}`)
                })
            )
        ),
        h(Collapsable, {title: `Hitpoints №${hitPoints.length}`}, 
            h("ul", null, 
                hitPoints.map(item=>{
                    return h('li', null, `${item}`)
                })
            )
        ),
        h(Collapsable, {title: `Lightpaths №${lightPaths.length}`}, 
            h("ul", null, 
                lightPaths.map(item=>{
                    return h('li', null, `${item}`)
                })
            )
        )
    )
}

const Outliner = ({scene=[]}={})=>{
    return h("section", null,
        h("h3", null, "Outliner"),
        h("ul", null, 
            ...scene.map((sceneObject)=>{
                return h("li", null, 
                        `${sceneObject}`
                    )
            })
        )
    )
}

const App = ()=>{
    /* STATE */
    const [showSettings, setShowSettings] = React.useState(true)
    const [showSceneInfo, setShowSceneInfo] = React.useState(false)
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Random
    })
    const updateRaytraceOptions = options=>setRaytraceOptions({...raytraceOptions, ...options})

    const [svgDisplayOptions, setSvgDisplayOptions] = React.useState({
        rays: false,
        hitPoints: false,
        lightPaths: false
    })
    const updateSvgDisplayOptions = options=> setSvgDisplayOptions({...svgDisplayOptions, ...options})

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    const [scene, setScene] = React.useState([
        new PointLight(P(230, 125)),
        new LaserLight(P(150,220), 0),
        new DirectonalLight(P(50,180), 20,0),
        new Circle(P(250, 310), new MirrorMaterial(), 50),
        new Rectangle(P(250,500), new MirrorMaterial(), 600,100),
        new LineSegment(P(400, 250), P(500, 130), new MirrorMaterial()),
        new LineSegment(P(370, 220), P(470, 100), new MirrorMaterial()),
        new Lens(P(250, 180),  new TransparentMaterial(), 20, 100, 100, 100),
        // new Circle(P(520, 550), new TransparentMaterial(), 100),
        // new Circle(P(120, 380), new TransparentMaterial(), 80),
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
    const [newRays, newHitPoints, newPaths] = raytrace(lights, [shapes, shapes.map(shp=>shp.material)], {
        maxBounce:raytraceOptions.maxBounce, 
        samplingMethod: raytraceOptions.samplingMethod, 
        lightSamples: raytraceOptions.lightSamples
    });
    // set React state
    const rays = newRays;
    const hitPoints = newHitPoints;
    const lightPaths = newPaths;

    /* step rayrace on animation frame */
    const [animate, setAnimate] = React.useState(true)
    const [count, setCount] = React.useState(0);
    const requestRef = React.useRef();

    const onAnimationTick = time => {
        // if (previousTimeRef.current != undefined) {
        setCount(prevCount => prevCount + 1);
        // }
        // previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(onAnimationTick);
      }
      
      React.useEffect(() => {
        if(animate){
            requestRef.current = requestAnimationFrame(onAnimationTick);
            return () => cancelAnimationFrame(requestRef.current);
        }
      }, [animate]); // Make sure the effect runs only once

    return h("div", null,
        h(GLViewport,  {
            className:"viewport",
            viewBox: viewBox,
            scene: scene,
            paths: lightPaths
            // paths: lightPaths,
            // lights: lights,
            // shapes: shapes,
        }),
        h(SVGViewport, {
            // style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: scene,
            selection:selection,
            onSelection: (newSelection)=>setSelection(newSelection),
            rays: svgDisplayOptions.rays?rays:[],
            hitPoints: svgDisplayOptions.hitPoints?hitPoints:[], 
            paths:svgDisplayOptions.lightPaths?lightPaths:[], 
            onSceneObject: (oldObject, newObject)=>updateSceneObject(oldObject, newObject)
        }),

        h("div", {
            className: "panel", 
            style: {right: "0px", top:"0px", position: "fixed"}
        }, 
            h(Collapsable, {
                title: h("h2", null, "Settings")
            },
                h('div', null, 
                    h("section", null,
                        h("h2", null, "Raytrace otions"),
                        h("table", null,
                            h("tr", null,
                                h("td", null, "animate"),
                                h("td", null,
                                    h('label', null,
                                        h('input', {
                                            name: "animate",
                                            type: 'checkbox', 
                                            checked:animate, 
                                            onChange:(e)=>setAnimate(e.target.checked)
                                        }),
                                        `animate №${count}`
                                    )
                                )
                            ),
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
                        h("form", {
                            onSubmit: (e)=>{
                                //TODO: use form submission istead of each input change to update settings
                                e.preventDefault();
                                const formData = new FormData(e.target)
                                const newData = Object.fromEntries(myFormData.entries());
                                setSvgDisplayOptions(newData);
                                return false;
                            }
                        }, 
                            h("label", null,
                                h("input", {
                                    name:"rays",
                                    checked: svgDisplayOptions.rays, 
                                    onChange: (e)=>updateSvgDisplayOptions({rays: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show rays"
                            ),
                            h("label", null,
                                h("input", {
                                    name:"hitPoints",
                                    checked: svgDisplayOptions.hitPoints, 
                                    onChange: (e)=>updateSvgDisplayOptions({hitPoints: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show hitpoints"
                            ),
                            h("label", null,
                                h("input", {
                                    name:"lightPaths",
                                    checked: svgDisplayOptions.lightPaths, 
                                    onChange: (e)=>updateSvgDisplayOptions({lightPaths: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show rays"
                            )
                        )
                    )
                )
            ),
            h(Collapsable, {title: h("h2", null, "Scene Info")}, null,
                h(Outliner, {scene: scene}),
                h(RaytraceStats, {
                    scene: scene, 
                    lightRays: rays, 
                    hitPoints: hitPoints, 
                    lightPaths: lightPaths
                })
            )
        )
    )
}
const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));