import ReactDOM from "react-dom"
import React, {createContext, useState, useReducer, useSyncExternalStore} from "react"

import SVGViewport from "./Views/SVGViewport.js";
import GLViewport from "./Views/GLViewport.js";
import Collapsable from "./UI/Collapsable.js";

import Shape from "./scene/shapes/Shape.js";
import Circle from "./scene/shapes/Circle.js"
import LineSegment from "./scene/shapes/LineSegment.js"
import Rectangle from "./scene/shapes/Rectangle.js"
import SphericalLens from "./scene/shapes/SphericalLens.js"
import Light from "./scene/lights/Light.js"
import PointLight from "./scene/lights/PointLight.js"
import LaserLight from "./scene/lights/LaserLight.js"
import DirectionalLight from "./scene/lights/DirectionalLight.js"


import {raytrace, SamplingMethod} from "./scene/raytrace.js"
import Inspector from "./Views/Inspector.js"


// Global Stores
import displayOptionsStore from "./stores/displayOptionsStore.js"
import raytraceOptionsStore from "./stores/raytraceOptionsStore.js"
import sceneStore from "./stores/sceneStore.js"
import selectionStore from "./stores/selectionStore.js"
import mouseToolsStore from "./stores/mouseToolsStore.js"

// Store Views
import DisplayOptionsForm from "./Views/DisplayOptionsForm.js";
import RaytraceOptionsForm from "./Views/RaytraceOptionsForm.js";
import Outliner from "./Views/Outliner.js"

/*MAIN*/ 
const h = React.createElement;

const generateId = ()=>{
    return Math.random().toString(32).substring(2, 9);
};

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

const App = ()=>{
    /*Settings*/
    const raytraceOptions = useSyncExternalStore(raytraceOptionsStore.subscribe, raytraceOptionsStore.getSnapshot);
    const displayOptions = useSyncExternalStore(displayOptionsStore.subscribe, displayOptionsStore.getSnapshot);

    // SCENE OBJECTS
    const scene = useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const selectionKeys = useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);
    

    // sync svg- and glviewport viewbox
    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    // 
    function calcRaytraceUniform()
    {
        const lights = Object.values(scene).filter(obj=>obj instanceof Light);
        const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);

        const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shape=>shape.material)], {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: raytraceOptions.samplingMethod, 
            lightSamples: raytraceOptions.lightSample
        });

        return newRaytraceResults
    }

    function calcRaytraceRandom()
    {
        const lights = Object.values(scene).filter(obj=>obj instanceof Light);
        const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);

        const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shape=>shape.material)], {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: SamplingMethod.Random, 
            lightSamples: raytraceOptions.lightSamples
        });

        return newRaytraceResults
    }

    const uniformRaytraceResults = calcRaytraceUniform();
    const randomRaytraceResults = calcRaytraceRandom();

    /* step rayrace on animation frame */
    const [animate, setAnimate] = React.useState(true);
    const [currentSampleStep, setCurrentSampleStep] = React.useState(0);
    const requestRef = React.useRef();

    const onAnimationTick = timeStamp => {
        setCurrentSampleStep(prevCount => prevCount + 1);
        requestRef.current = requestAnimationFrame(onAnimationTick);
    }

    // TODO: move this and the whole animation to the GLVewiprot component
    // stop animation when max samples reached 
    React.useEffect(()=>{
        if(currentSampleStep>raytraceOptions.maxSampleSteps){
            setAnimate(false);
        }
    }, [currentSampleStep])

    React.useEffect(() => {
        if(animate)
        {
            setCurrentSampleStep(0)
            requestRef.current = requestAnimationFrame(onAnimationTick);
            return () => cancelAnimationFrame(requestRef.current);
        }
    }, [animate]); // Make sure the effect runs only once

    /* MOUSE TOOLS */
    const currentToolName = React.useSyncExternalStore(mouseToolsStore.subscribe, mouseToolsStore.getSnapshot);

    const mouseTools = [
        {
            name: "circle",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});

                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                // create circle
                const key = generateId();
                sceneStore.addSceneObject(key, new Circle({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    radius:5, 
                    material: "glass"
                }));

                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    sceneStore.updateSceneObject(key, {
                        radius: Math.hypot(dx, dy)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null)
                }, {once: true});
            }
        },
        {
            name: "rectangle",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                const key = generateId();
    
                sceneStore.addSceneObject(key, new Rectangle({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    width: 5,
                    height: 5,
                    material: "diffuse"
                }));

                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    sceneStore.updateSceneObject(key, {
                        width: Math.abs(dx)*2,
                        height: Math.abs(dy)*2
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null)
                }, {once: true});
            }
        },
        {
            name: "line",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                const key = generateId();
                sceneStore.addSceneObject(key, new LineSegment({
                    Ax: beginSceneX, 
                    Ay: beginSceneY, 
                    Bx: beginSceneX+5,
                    By: beginSceneY,
                    material: "diffuse"
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y];
    
                    sceneStore.updateSceneObject(key, {
                        Bx: sceneX, 
                        By: sceneY
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null)
                }, {once: true});
            }
        },
        {
            name: "lens",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];

                const key = generateId();
                sceneStore.addSceneObject(key, new SphericalLens({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    centerThickness: 5,
                    edgeThickness: 0,
                    material: "glass"
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

                    sceneStore.updateSceneObject(key, {
                        diameter: Math.abs(dy*2),
                        edgeThickness:   dx>0 ?    1 : dx*2,
                        centerThickness: dx>0 ? dx*2 : 0
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null)
                }, {once: true});
            }
        },
        {
            name: "pointlight",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                const key = generateId();
                sceneStore.addSceneObject(key, new PointLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

                    sceneStore.updateSceneObject(key, {
                        angle: Math.atan2(dy, dx)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null);
                }, {once: true});
            }
        },
        {
            name: "directional",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
                
                const key = generateId();
                sceneStore.addSceneObject(key, new DirectionalLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

                    sceneStore.updateSceneObject(key, {
                        angle: Math.atan2(dy, dx),
                        width: Math.hypot(dx, dy)/2
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null);
                }, {once: true});
            }
        },
        {
            name: "laser",
            handler: e => {
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                const key = generateId();
                sceneStore.addSceneObject(key, new LaserLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
                    
                    sceneStore.updateSceneObject(key, {
                        angle: Math.atan2(dy, dx)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    mouseToolsStore.setCurrentTool(null);
                }, {once: true});
            }
        }
    ]

    const handleMouseDownTools = e =>
    {
        
        const toolIdx = mouseTools.findIndex(tool=>tool.name==currentToolName);
        console.log("handle tool", mouseTools[toolIdx])
        if(toolIdx>=0){
            e.preventDefault()
            mouseTools[toolIdx].handler(e)
        }
    }

    return h("div", null,
            /*VIEWPORTS*/
            displayOptions.glPaint?h(GLViewport,  {
                className:"viewport",
                viewBox: viewBox,

                scene: scene,
                paths: randomRaytraceResults.lightPaths,
                onReset: ()=>{
                    // TODO: this is temporary. rendering and raytacing should be seperated from this component.
                    setCurrentSampleStep(0); setAnimate(true);
                }
            }):null,
            h(SVGViewport, {
                className:"viewport",
                viewBox: viewBox,

                rays: displayOptions.lightrays?uniformRaytraceResults.lightrays:[],
                hitPoints: displayOptions.hitpoints?uniformRaytraceResults.hitPoints:[], 
                paths:displayOptions.lightpaths?uniformRaytraceResults.lightPaths:[], 


                onViewChange: viewBox=>setViewBox(viewBox),
                onMouseDown: e=>{
                    console.log("handle mousedown")
                    if(currentToolName)
                    {
                        handleMouseDownTools(e);
                        e.preventDefault();
                    }
                },
                // onClick:(e)=>{
                //     // TODO check the actual element not just the type
                //     if(e.target.tagName=="svg")
                //     {
                //         selectionStore.setSelectionKeys([]);
                //     }
                // }
            },
                
            ),

            /*TOOLBAR*/
            h("div", {
                id: "toolbar", className: "panel"
            },
                h("button", {
                    onClick: e=>setCurrentToolName(null),
                    className: currentToolName == null ? "active" : null
                }, h("i", {className: "fa-solid fa-arrow-pointer"})),

                mouseTools.map(tool=>{
                    return h("button", {
                        onClick: e=>mouseToolsStore.setCurrentTool(tool.name),
                        title: tool.name,
                        className: currentToolName == tool.name ? "active" : null
                    }, tool.name)
                }),
                h("hr"),
                h("button", {
                    onClick: (e)=>{
                        if(selectionKeys.length<1){
                            return;
                        }
                        const selectedObjectKey = selectionKeys[0];
                        if(selectedObjectKey)
                        {
                            sceneStore.removeSceneObject(selectedObjectKey)
                        }
                    },
                    className: "danger"
                }, "delete")
            ),

            h("div", {
                className: "panel", 
                style: {right: "0px", top:"0px", position: "fixed"}
            }, 

                // h(BlackBody, null),
                h(Inspector, {
                    sceneObject: selectionKeys.length>0?scene[selectionKeys[0]]:null,
                    onChange: (newSceneObject)=>sceneStore.updateSceneObject(selectionKeys[0], newSceneObject)
                }),
                h(Collapsable, {title: h("h2", null, "Raytrace otions"), defaultOpen:false},
                    h(RaytraceOptionsForm)
                ),
                h(Collapsable, {title: h("h2", null, "Display options"), defaultOpen:false},
                    h(DisplayOptionsForm)
                ),
                h(Collapsable, {title: h("h2", null, "Outliner"), defaultOpen: false},
                    h(Outliner)
                )
            )
        )
}

const rdom = ReactDOM.createRoot(document.getElementById('root'));
rdom.render(React.createElement(App));