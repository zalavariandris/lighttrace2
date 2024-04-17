import ReactDOM from "react-dom"
import React, {useState} from "react"

import SVGViewport from "./UI/SVGViewport.js";
import GLViewport from "./ModelView/GLViewport.js";
import Collapsable from "./UI/Collapsable.js";
import {Point, Vector, P, V} from "./scene/geo.js"

import Shape from "./scene/shapes/Shape.js";
import Circle from "./scene/shapes/Circle.js"
import LineSegment from "./scene/shapes/LineSegment.js"
import Rectangle from "./scene/shapes/Rectangle.js"
import SphericalLens from "./scene/shapes/SphericalLens.js"

import Light from "./scene/lights/Light.js"
import PointLight from "./scene/lights/PointLight.js"
import LaserLight from "./scene/lights/LaserLight.js"
import DirectionalLight from "./scene/lights/DirectionalLight.js"

import DiffuseMaterial from "./scene/materials/DiffuseMaterial.js";
import TransparentMaterial from "./scene/materials/TransparentMaterial.js";
import MirrorMaterial from "./scene/materials/MirrorMaterial.js";

import {colorFromRGB, wavelengthToRGB} from "./scene/colorUtils.js"

import {Lightray, makeRaysFromLights, raytrace, SamplingMethod} from "./scene/raytrace.js"
import Inspector from "./ModelView/Inspector.js"

import Manipulator from "./UI/Manipulator.js";
import ShapeModelView from "./ModelView/ShapeModelView.js";

const h = React.createElement;

const generateId = ()=>{
    return Math.random().toString(32).substring(2, 9);
};

function RaytraceStats({
    scene=[],
    lightRays=[],
    hitPoints=[],
    lightPaths=[]
}={})
{
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

function cursorPoint(svg, {x, y}){
    let pt = svg.createSVGPoint();
    pt.x =x; pt.y = y;
    const scenePoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:scenePoint.x, y:scenePoint.y};
}

const App = ()=>{

    /* STATE and Actions */
    const [raytraceOptions, setRaytraceOptions] = React.useState({
        maxBounce: 9,
        lightSamples: 7,
        samplingMethod: SamplingMethod.Uniform,
        maxSampleSteps: 1024
    });
    const updateRaytraceOptions = options=>setRaytraceOptions({...raytraceOptions, ...options});

    const [displayOptions, setDisplayOptions] = React.useState({
        lightrays: true,
        hitPoints: true,
        lightPaths: false,
        glPaint: false
    });
    const updateDisplayOptions = options => setDisplayOptions({...displayOptions, ...options});

    const [viewBox, setViewBox] = React.useState({
        x:0,y:0,w:512,h:512
    });

    // SCENE OBJECTS
    const [scene, setScene] = useState({
        "mirror ball" :new Circle({
            Cx:360, 
            Cy:200, 
            radius: 50, 
            material: "mirror"
        }),
        "rect prism": new Rectangle({
            Cx: 500,
            Cy: 250,
            width: 150,
            height: 150,
            material: "glass"
        }),
        "floor line": new LineSegment({
            Ax: 50, 
            Ay: 450, 
            Bx: 462, 
            By: 450, 
            material: "mirror"
        }),
        "concave lens": new SphericalLens({
            Cx: 150, 
            Cy:250, 
            diameter: 140,
            edgeThickness: 60,
            centerThickness:5,
            material: "glass" 
        }),
        "convex lens": new SphericalLens({
            Cx: 230, 
            Cy: 250,
            diameter: 100,
            edgeThickness: 5,
            centerThickness: 50, 
            material: "glass", 
        }),
        "sun": new DirectionalLight({Cx:50, Cy: 250, width: 80, angle: 0}),
        "lamp": new PointLight({Cx: 50, Cy: 150, angle:0}),

        "laser": new LaserLight({Cx:150, Cy: 150, angle: 0.5}),
});

    const updateSceneObject = (key, newAttributes)=>{
        setScene( scene => {
            // update objects            
            if(!scene.hasOwnProperty(key))
            {
                console.warn("old scene object not in current scene")
                return scene;
            }
            const newSceneObject = scene[key].copy()
            for(let [attr, value] of Object.entries(newAttributes)){
                newSceneObject[attr] = value;
            }
            
            return {...scene, [key]: newSceneObject};
        });
    };

    /* MATERIALS */
    const [materials, setMaterials] = React.useState({
        "glass": new TransparentMaterial(),
        "diffuse": new DiffuseMaterial(),
        "mirror": new MirrorMaterial()
    })

    /* SELECTION */
    const [selectionKeys, setSelectionKeys] = useState([])

    const getSelectedSceneObject=()=>
    {
        const key = selectionKeys[0];
        if(key && scene.hasOwnProperty(key)){
            return scene[key]
        }
        return null;
    }

    const addSceneObject = (key, newSceneObject)=>{
        setScene(scene=>{
            return {...scene, [key]: newSceneObject}
        })
    }

    const removeSceneObject = (key, sceneObject)=>{ 
        setScene(Object.fromEntries(Object.entries(scene).filter(([k, v]) =>{
            return k!== key;
        })));
        setSelectionKeys([]);
    }

    // 
    function calcRaytraceUniform()
    {
        const lights = Object.values(scene).filter(obj=>obj instanceof Light);
        const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);
        const shapesMaterials = shapes.map(s=>materials[s.material]);

        const newRaytraceResults = raytrace(lights, [shapes, shapesMaterials], {
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
        const shapesMaterials = shapes.map(s=>materials[s.material]);

        const newRaytraceResults = raytrace(lights, [shapes, shapesMaterials], {
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
    const [currentToolName, setCurrentToolName] = React.useState(null);

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
                addSceneObject(key, new Circle({
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
    
                    updateSceneObject(key, {
                        radius: Math.hypot(dx, dy)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
    
                addSceneObject(key, new Rectangle({
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
    
                    updateSceneObject(key, {
                        width: Math.abs(dx)*2,
                        height: Math.abs(dy)*2
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
                addSceneObject(key, new LineSegment({
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
    
                    updateSceneObject(key, {
                        Bx: sceneX, 
                        By: sceneY
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
                addSceneObject(key, new SphericalLens({
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

                    updateSceneObject(key, {
                        diameter: Math.abs(dy*2),
                        edgeThickness:   dx>0 ?    1 : dx*2,
                        centerThickness: dx>0 ? dx*2 : 0
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
                addSceneObject(key, new PointLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

                    updateSceneObject(key, {
                        angle: Math.atan2(dy, dx)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
                addSceneObject(key, new DirectionalLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];

                    updateSceneObject(key, {
                        angle: Math.atan2(dy, dx),
                        width: Math.hypot(dx, dy)/2
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
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
                addSceneObject(key, new LaserLight({
                    Cx: beginSceneX, 
                    Cy: beginSceneY, 
                    angle: 0
                }));
    
                const handleDrag = e=>{
                    // var svg  = e.target.closest("SVG");
                    let loc = cursorPoint(svg, {x: e.clientX, y:e.clientY});
                    const [sceneX, sceneY] = [loc.x, loc.y]
                    const [dx, dy] = [sceneX-beginSceneX, sceneY-beginSceneY];
                    
                    updateSceneObject(key, {
                        angle: Math.atan2(dy, dx)
                    });
                }
    
                window.addEventListener("mousemove", handleDrag);
                window.addEventListener("mouseup", e=>{
                    window.removeEventListener("mousemove", handleDrag);
                    setCurrentToolName(null)
                }, {once: true});
            }
        }
    ]

    const handleMouseDownTools = e =>
    {
        console.log("handle tool", mouseTools[toolIdx])
        const toolIdx = mouseTools.findIndex(tool=>tool.name==currentToolName);
        if(toolIdx>=0){
            e.preventDefault()
            mouseTools[toolIdx].handler(e)
        }
    }

    const svgRef = React.useRef(null)

    return h("div", null,
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
            onViewChange: viewBox=>setViewBox(viewBox),
            rays: displayOptions.lightrays?uniformRaytraceResults.lightrays:[],
            hitPoints: displayOptions.hitPoints?uniformRaytraceResults.hitPoints:[], 
            paths:displayOptions.lightPaths?uniformRaytraceResults.lightPaths:[], 
            ref: svgRef,
            onMouseDown: e=>{
                console.log("handle mousedown")
                if(currentToolName)
                {
                    handleMouseDownTools(e);
                    e.preventDefault();
                }
            },
            onClick:(e)=>{
                // TODO check the actual element not just the type
                if(e.target.tagName=="svg")
                {
                    setSelectionKeys([]);
                }
            }
        },
            h("g", null, 
                Object.entries(scene).map( ([key, sceneObject])=>{
                    return h(ShapeModelView, {
                        className: selectionKeys.indexOf(key)>=0 ? "sceneItem selected" : "sceneItem not-selected",
                        sceneObject, 
                        onChange: (value)=>updateSceneObject(key, value),
                        onClick: e=>{
                            setSelectionKeys([key])
                        }
                    })
                })
            )
        ),

        h("div", {
            id: "toolbar", className: "panel"
        },
            h("button", {
                onClick: e=>setCurrentToolName(null),
                className: currentToolName == null ? "active" : null
            }, h("i", {className: "fa-solid fa-arrow-pointer"})),

            mouseTools.map(tool=>{
                return h("button", {
                    onClick: e=>setCurrentToolName(tool.name),
                    title: tool.name,
                    className: currentToolName == tool.name ? "active" : null
                }, tool.name)
            }),
            h("hr"),
            h("button", {
                onClick: (e)=>{
                    const selectedObject = getSelectedSceneObject();
                    if(selectedObject)
                    {
                        removeSceneObject(selectedObject)
                    }
                },
                className: "danger"
            }, "delete")
        ),

        h("div", {
            className: "panel", 
            style: {right: "0px", top:"0px", position: "fixed"}
        }, 
            h(Inspector, {
                sceneObject: selectionKeys.length>0?scene[selectionKeys[0]]:null,
                onChange: (newSceneObject)=>updateSceneObject(selectionKeys[0], newSceneObject)
            }),
            h(Collapsable, {title: h("h2", null, "Raytrace otions"), defaultOpen:false},
                h("form", null,
                    h("label", null, `Sampling steps: ${currentSampleStep}`,
                        "/",
                        h("input", {
                            type: "number", 
                            value: raytraceOptions.maxSampleSteps,
                            onChange:e=>updateRaytraceOptions({maxSampleSteps: e.target.value})
                        }),
                        h("progress", {value: currentSampleStep, max:raytraceOptions.maxSampleSteps}),
                    ),

                    h("label", null, "Light samples",
                        h("input", {
                            type:"range", 
                            name: "light samples",
                            value:raytraceOptions.lightSamples, 
                            onInput:(e)=>updateRaytraceOptions({lightSamples: e.target.value}),
                            min: 1, 
                            max:200
                        }),
                        `${raytraceOptions.lightSamples}`
                    ),
                    h("label", null, "Max bounce",
                        h("input", {
                            type:"range", 
                            name: "max bounce",
                            value:raytraceOptions.maxBounce, 
                            onInput:(e)=>updateRaytraceOptions({maxBounce: e.target.value}), 
                            min: 0, 
                            max:16
                        }),
                        `${raytraceOptions.maxBounce}`
                    ),
                    h("label", null, "Sampling method",
                        h("label", null, 
                            SamplingMethod.Random,
                            h("input", {
                                name: "sampling", 
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Random,
                                onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                                id:SamplingMethod.Random, 
                                type:"radio", 
                                value:SamplingMethod.Random
                            })
                        ),
                        h("label", null, 
                            SamplingMethod.Uniform,
                            h("input", {
                                name: "sampling",
                                checked: raytraceOptions.samplingMethod == SamplingMethod.Uniform,
                                onChange: (e)=>updateRaytraceOptions({samplingMethod: e.target.value}),
                                id: SamplingMethod.Uniform,
                                type:"radio",
                                value:SamplingMethod.Uniform
                            })
                        )
                    )
                ),
            ),
            h(Collapsable, {title: h("h2", null, "Display options"), defaultOpen:false},
                h("form", {
                    onSubmit: (e)=>{
                        //TODO: use form submission istead of each input change to update settings
                        e.preventDefault();
                        const formData = new FormData(e.target)
                        const newData = Object.fromEntries(myFormData.entries());
                        setDisplayOptions(newData);
                        return false;
                    }
                }, 
                    h("label", null,
                        h("input", {
                            name:"rays",
                            checked: displayOptions.lightrays, 
                            onChange: (e)=>updateDisplayOptions({lightrays: e.target.checked}),
                            type: "checkbox"
                        }),
                        "show lightrays"
                    ),
                    h("br"),
                    h("label", null,
                        h("input", {
                            name:"hitPoints",
                            checked: displayOptions.hitPoints, 
                            onChange: (e)=>updateDisplayOptions({hitPoints: e.target.checked}),
                            type: "checkbox"
                        }),
                        "show hitpoints"
                    ),
                    h("br"),
                    h("label", null,
                        h("input", {
                            name:"lightPaths",
                            checked: displayOptions.lightPaths, 
                            onChange: (e)=>updateDisplayOptions({lightPaths: e.target.checked}),
                            type: "checkbox"
                        }),
                        "show lightpaths"
                    ),
                    h("label", null,
                    h("input", {
                        name:"glPaint",
                        checked: displayOptions.glPaint, 
                        onChange: (e)=>updateDisplayOptions({glPaint: e.target.checked}),
                        type: "checkbox"
                    }),
                    "show gl paint"
                )
                
                )
            ),
            h(Collapsable, {title: h("h2", null, "Outliner"), defaultOpen: false},
                    h("ul", null, 
                        ...Object.entries(scene).map(([key, sceneObject])=>{
                            return h("li", {
                                style: {fontStyle: selectionKeys.indexOf(key)>=0?"italic":"normal"}
                            }, 
                                h("a", {
                                    href:"#", 
                                    onClick:(e)=>{
                                        e.preventDefault();
                                        setSelectionKeys([key]);
    
                                    }
                                }, 
                                    `${key}`
                                )
                            )
                        })
                    )
            ),
            h(Collapsable, {title: h("h2", null, "Raytrace shapes"), defaultOpen:false},
                h(RaytraceStats, {
                    scene: Object.values(scene), 
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