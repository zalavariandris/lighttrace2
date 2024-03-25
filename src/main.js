import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./components/SVGViewport.js";
import GLViewport from "./components/GLViewport.js";
import Collapsable from "./components/Collapsable.js";
import {Point, Vector, P, V} from "./geo.js"

import Shape from "./scene/shapes/Shape.js";
import Circle from "./scene/shapes/Circle.js"
import LineSegment from "./scene/shapes/LineSegment.js"
import Rectangle from "./scene/shapes/Rectangle.js"
import SphericalLens from "./scene/shapes/SphericalLens.js"

import Light from "./scene/lights/Light.js"
import PointLight from "./scene/lights/PointLight.js"
import LaserLight from "./scene/lights/LaserLight.js"
import DirectionalLight from "./scene/lights/DirectionalLight.js"

import Material from "./scene/materials/Material.js"
import MirrorMaterial from "./scene/materials/MirrorMaterial.js"
import TransparentMaterial from "./scene/materials/TransparentMaterial.js"
import DiffuseMaterial from "./scene/materials/DiffuseMaterial.js"


import {Lightray, makeRaysFromLights, raytrace, SamplingMethod} from "./raytrace.js"
import Inspector from "./components/Inspector.js"
import CircleItem from "./components/CircleItem.js";


const h = React.createElement;
function RaytraceStats({
    scene=[],
    lightRays=[],
    hitPoints=[],
    lightPaths=[]
}={}){
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
                    return h('li', null, `${item}`);
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

function Outliner({scene=[]}={})
{
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

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

const App = ()=>{
    console.log("render App")
    /* STATE */
    const [showSettings, setShowSettings] = React.useState(true)
    const [showSceneInfo, setShowSceneInfo] = React.useState(false)
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Uniform
    })
    const updateRaytraceOptions = options=>setRaytraceOptions({...raytraceOptions, ...options})

    const [svgDisplayOptions, setSvgDisplayOptions] = React.useState({
        lightrays: false,
        hitPoints: false,
        lightPaths: true
    })
    const updateSvgDisplayOptions = options=> setSvgDisplayOptions({...svgDisplayOptions, ...options})

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    const [scene, setScene] = React.useState([      
        new DirectionalLight({x:50, y: 250, width: 80, angle: 0}),
        new PointLight({x: 50, y: 150, angle:0}),
        new LaserLight({x:50, y: 200, angle: 0}),
        new SphericalLens({x: 150, y:250, material: new TransparentMaterial(), 
            diameter: 140,
            edgeThickness: 60,
            centerThickness:5
        }),
        new SphericalLens({x: 230, y: 250, material: new TransparentMaterial(), 
            diameter: 100,
            edgeThickness: 5,
            centerThickness: 50
        }),
        new Circle({x: 400, y:220, material: new MirrorMaterial(), radius: 50}),
        new LineSegment({Ax: 50, Ay: 450, Bx: 462, By: 450, material: new DiffuseMaterial()}),
    ]);

    const addSceneObject = (sceneObject)=>{
        console.log("addSceneObject", sceneObject)
        setScene(scene=>[...scene, sceneObject])
        setSelection(selection=>[sceneObject])
    }

    const removeSelectedObjects=()=>{
        setScene(scene=>scene.filter(sceneObject=>selection.indexOf(sceneObject)<0));
        setSelection(selection=>[]);
    }

    const [selection, setSelection] = React.useState([])
    const updateSceneObject = (oldObject, newObject)=>{
        const sceneIdx = scene.indexOf(oldObject);

        if(sceneIdx<0) {
            console.warn("scenr object is not in Scene", oldObject)
            return scene;
        }
        const newScene = scene.toSpliced(sceneIdx, 1, newObject)

        setScene(newScene);
        // setSelection(selection=>[])
    }

    function updateRaytraceUniform()
    {
        const lights = scene.filter(obj=>obj instanceof Light)
        const shapes = scene.filter(obj=>obj instanceof Shape)
        const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shp=>shp.material)], {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: raytraceOptions.samplingMethod, 
            lightSamples: raytraceOptions.lightSamples
        });

        return newRaytraceResults
    }
    const uniformRaytraceResults = updateRaytraceUniform();

    function updateRaytraceRandom()
    {
        const lights = scene.filter(obj=>obj instanceof Light)
        const shapes = scene.filter(obj=>obj instanceof Shape)
        const newRaytraceResults = raytrace(lights, [shapes, shapes.map(shp=>shp.material)], {
            maxBounce:raytraceOptions.maxBounce, 
            samplingMethod: SamplingMethod.Random, 
            lightSamples: raytraceOptions.lightSamples
        });

        return newRaytraceResults
    }
    const randomRaytraceResults = updateRaytraceRandom();

    /* step rayrace on animation frame */
    const [animate, setAnimate] = React.useState(false)
    const [count, setCount] = React.useState(0);
    const requestRef = React.useRef();

    const onAnimationTick = timeStamp => {
        setCount(prevCount => prevCount + 1);

        requestRef.current = requestAnimationFrame(onAnimationTick);
    }

    React.useEffect(() => {
        if(animate){
            requestRef.current = requestAnimationFrame(onAnimationTick);
            return () => cancelAnimationFrame(requestRef.current);
        }
    }, [animate]); // Make sure the effect runs only once

    const [currentToolName, setCurrentToolName] = React.useState(null);



    const tools = [
        {name: "circle",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                // create circle
                let sceneObject = new Circle({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    radius:5, 
                    material: new TransparentMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.radius = Math.hypot(dx, dy);
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "rectangle",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                let sceneObject = new Rectangle({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    width: 5,
                    height: 5,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.width = Math.abs(dx)*2;
                    newSceneObject.height = Math.abs(dy)*2;
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "line",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                let sceneObject = new LineSegment({
                    Ax: beginSceneX, 
                    Ay: beginSceneY, 
                    Bx: beginSceneX+5,
                    By: beginSceneY,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.Bx = sceneX;
                    newSceneObject.By = sceneY;
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "lens",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
                let sceneObject = new SphericalLens({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    centerThickness: 5,
                    edgeThickness: 0,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.diameter = Math.abs(dy*2)
                    if(dx>0){
                        newSceneObject.edgeThickness = 1;
                        newSceneObject.centerThickness = dx*2;
                    }else{
                        newSceneObject.edgeThickness = dx*2;
                        newSceneObject.centerThickness = 1;
                    }
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "pointlight",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                let sceneObject = new PointLight({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    angle: 0,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.angle = Math.atan2(dy, dx);
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "directional",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
                
                let sceneObject = new DirectionalLight({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    angle: 0,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.angle = Math.atan2(dy, dx);
                    newSceneObject.width = Math.hypot(dx, dy)/2;
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        },
        {name: "laser",
            handler: (e)=>{
                e.preventDefault();
                var svg  = e.target.closest("SVG");
                let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                const [beginSceneX, beginSceneY] = [loc.x, loc.y];
    
                let sceneObject = new LaserLight({
                    x: beginSceneX, 
                    y: beginSceneY, 
                    angle: 0,
                    material: new DiffuseMaterial()
                });
    
                addSceneObject(sceneObject);
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
    
                    const newSceneObject = sceneObject.copy(); 
                    newSceneObject.angle = Math.atan2(dy, dx);
                    setScene(scene=>{
                        const idx = scene.indexOf(sceneObject);
                        sceneObject = newSceneObject;
                        return scene.toSpliced(idx, 1, newSceneObject);
                    })
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        }
     ]

    const handleMouseDownTools = e=>
    {
        const toolIdx = tools.findIndex(tool=>tool.name==currentToolName);
        if(toolIdx>=0){
            e.preventDefault()
            tools[toolIdx].handler(e)
        }
    }

    return h("div", null,
        // h(GLViewport,  {
        //     className:"viewport",
        //     viewBox: viewBox,
        //     scene: scene,
        //     paths: randomRaytraceResults.lightPaths
        // }),
        h(SVGViewport, {
            // style: {opacity: "0.2"},
            className:"viewport",
            viewBox: viewBox,
            onViewChange: (value) => setViewBox(value),
            scene: scene,
            selection:selection,
            onSelection: (newSelection)=>{
                console.log("main->setSelection", newSelection)
                setSelection(newSelection);
            },
            rays: svgDisplayOptions.lightrays?uniformRaytraceResults.lightrays:[],
            hitPoints: svgDisplayOptions.hitPoints?uniformRaytraceResults.hitPoints:[], 
            paths:svgDisplayOptions.lightPaths?uniformRaytraceResults.lightPaths:[], 
            onSceneObject: (oldObject, newObject)=>updateSceneObject(oldObject, newObject),

            onMouseDown: e=>{
                if(currentToolName)
                {
                    handleMouseDownTools(e);
                }
            }
        }),
        h("div", {
            id: "toolbar", className: "panel"
        },
            h("button", {
                onClick: e=>setCurrentToolName(null),
                className: currentToolName == null ? "active" : null
            }, h("i", {className: "fa-solid fa-arrow-pointer"})),

            tools.map(tool=>{
                return h("button", {
                    onClick: e=>setCurrentToolName(tool.name),
                    title: tool.name,
                    className: currentToolName == tool.name ? "active" : null
                }, tool.name)
            }),
            h("hr"),
            h("button", {
                onClick: (e)=>removeSelectedObjects(),
                className: "danger"
            }, "delete")
        ),

        h("div", {
            className: "panel", 
            style: {right: "0px", top:"0px", position: "fixed"}
        }, 
            selection[0]?h(Inspector, {
                sceneObject: selection[0],
                onChange: (oldObject, newObject)=>updateSceneObject(oldObject, newObject)
            }):null,
            h(Collapsable, {title: h("h2", null, "Settings")},
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
                                    checked: svgDisplayOptions.lightrays, 
                                    onChange: (e)=>updateSvgDisplayOptions({lightrays: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show lightrays"
                            ),
                            h("br"),
                            h("label", null,
                                h("input", {
                                    name:"hitPoints",
                                    checked: svgDisplayOptions.hitPoints, 
                                    onChange: (e)=>updateSvgDisplayOptions({hitPoints: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show hitpoints"
                            ),
                            h("br"),
                            h("label", null,
                                h("input", {
                                    name:"lightPaths",
                                    checked: svgDisplayOptions.lightPaths, 
                                    onChange: (e)=>updateSvgDisplayOptions({lightPaths: e.target.checked}),
                                    type: "checkbox"
                                }),
                                "show lightpaths"
                            )
                        )
                    )
                )
            ),
            h(Collapsable, {title: h("h2", null, "Scene Info")}, null,
                h(Outliner, {scene: scene}),
                h(RaytraceStats, {
                    scene: scene, 
                    lightRays: uniformRaytraceResults.rays, 
                    hitPoints: uniformRaytraceResults.hitPoints, 
                    lightPaths: uniformRaytraceResults.lightPaths
                })
            )
        )
    )
}

const rdom = ReactDOM.createRoot(document.getElementById('root'))
rdom.render(React.createElement(App));