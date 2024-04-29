import React, {useState} from "react"
import {RGBToCSS, wavelengthToRGB, temperatureToRGB} from "../scene/colorUtils.js"

import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import CircleView from "../UI/SVGEditableElements/CircleView.js";
import DirectionalLightView from "../UI/SVGEditableElements/DirectionalLightView.js"
import LaserLightView from "../UI/SVGEditableElements/LaserLightView.js"
import PointLightView from "../UI/SVGEditableElements/PointLightView.js";
import RectView from "../UI/SVGEditableElements/RectView.js"
import LineView from "../UI/SVGEditableElements/LineView.js"
import SphericalLensView from "../UI/SVGEditableElements/SphericalLensView.js"

import sceneStore from "../stores/sceneStore.js";
import selectionStore from "../stores/selectionStore.js";
import { SamplingMethod } from "../stores/raytraceOptionsStore.js";
import displayOptionsStore from "../stores/displayOptionsStore.js"

import Shape from "../scene/shapes/Shape.js";
import Light from "../scene/lights/Light.js";
import { raytrace } from "../scene/raytrace.js"

function viewboxString(viewBox)
{
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
}

// utils
function lightpathToPoints(lightpath)
{
    const points = lightpath.rays.map(r=>r.origin);
    const lastRay = lightpath.rays[lightpath.rays.length-1]
    points.push({x: lastRay.origin.x+lastRay.direction.x*1000, y: lastRay.origin.y+lastRay.direction.y*1000});
    return points;
}
    
function pointsToSvgPath(points)
{
    let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
    return path;
}

const calcScale = (svg, viewBox)=>{
    // const svg = svgRef.current;
    if(svg)
    {
        const clientSize = {w: svg.clientWidth, h: svg.clientHeight}
        return viewBox.w/clientSize.w;
    }else{
        return 1.0;
    }
}

const h = React.createElement;
function SVGViewport({
    viewBox={x:0, y:0, w:512, h:512}, 
    onViewChange=()=>{},
    onSceneObject=()=>{},
    onSelection=()=>{},
    ...props
}={})
{
    const scene = React.useSyncExternalStore(sceneStore.subscribe, sceneStore.getSnapshot);
    const selectionKeys = React.useSyncExternalStore(selectionStore.subscribe, selectionStore.getSnapshot);
    const svgRef = React.useRef()

    // event handling
    const onmousewheel = (e)=>{
        const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
        var w = viewBox.w;
        var h = viewBox.h;
        var mx = e.clientX;//mouse x  
        var my = e.clientY;
        var dw = w*e.deltaY*0.01*-0.05;
        var dh = h*e.deltaY*0.01*-0.05; 
        var dx = dw*mx/clientSize.w;
        var dy = dh*my/clientSize.h;
        const newViewBox = {
            x:viewBox.x+dx,
            y:viewBox.y+dy,
            w:viewBox.w-dw,
            h:viewBox.h-dh
        }

        onViewChange(newViewBox)
    }

    const panViewportTool = (e)=>{ 
        if(props.onMouseDown)
        {
            props.onMouseDown(e);
        }
        if(e.defaultPrevented){
            return;
        }

        const panBegin = {x: e.clientX, y: e.clientY};

        const handleDrag = (e)=>{
            if(props.onMouseMove){
                props.onMouseMove(e);
            }
            if(e.defaultPrevented){
                return;
            }

            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            let current_scale = clientSize.w/viewBox.w;
            
            var dx = -(e.clientX-panBegin.x)/current_scale;
            var dy = -(e.clientY-panBegin.y)/current_scale;
            
            var newViewBox = {
                x:viewBox.x+dx,
                y:viewBox.y+dy,
                w:viewBox.w,
                h:viewBox.h
            };
    
            onViewChange(newViewBox)
        }
    

        window.addEventListener('mousemove', handleDrag);
        window.addEventListener('mouseup', ()=>window.removeEventListener("mousemove", handleDrag), {once: true});
    }
 
    const displayOptions = React.useSyncExternalStore(displayOptionsStore.subscribe, displayOptionsStore.getSnapshot);

    const lights = Object.values(scene).filter(obj=>obj instanceof Light);
    const shapes = Object.values(scene).filter(obj=>obj instanceof Shape);
    const simpleRaytraceResults = raytrace(lights, [shapes, shapes.map(shape=>shape.material)], {
        maxBounce: 9, 
        samplingMethod: SamplingMethod.Random,
        lightSamples: 16
    });

    const rays = displayOptions.lightrays ? simpleRaytraceResults.lightrays || [] : [];
    const hitPoints =  displayOptions.hitpoints ? simpleRaytraceResults.hitPoints || [] : [];
    const paths = displayOptions.lightpaths ? simpleRaytraceResults.lightPaths || [] : [];

    return h('svg', {
            xmlns:"http://www.w3.org/2000/svg",
            width: props.width,
            height: props.height,
            className: props.className,
            style: {"--zoom": calcScale(svgRef.current, viewBox), ...props.style},
            ref: svgRef,
            viewBox: viewboxString(viewBox),
            ...props,
            onMouseDown: (e) => panViewportTool(e),
            onWheel: (e) => onmousewheel(e)     
        },
        h('defs', null, 
            h('marker', {
                markerUnits:"strokeWidth",
                id:'head',
                orient:"auto",
                markerWidth:'8',
                markerHeight:'8',
                refX:'0',
                refY:'4'
            },
                h('path', {d:'M0,0 V8 L8,4 Z'})
            )
        ),
        h("text", {
            x: 0, y:0,
            style: {transform: `scale(var(--zoom))`}
        }, "O"),
        h('g', {className: 'paths'},
            paths.filter(path => path.rays.length > 1).map(path =>
                h('g', null,
                    h('path', {
                        d: pointsToSvgPath(lightpathToPoints(path)),
                        fill: 'none',
                        stroke: `hsl(0deg 100% 100% / 10%)`,
                        className: 'lightpath',
                        strokeLinejoin:"round",
                        strokeLinecap:"round",
                        vectorEffect: "non-scaling-stroke",
                    })
                )
            )
        ),
        h('g', { className: 'rays'},
            rays==undefined?null:rays.map(ray =>
                h('g', null,
                    h('line', {
                        x1: ray.origin.x,
                        y1: ray.origin.y,
                        x2: ray.origin.x + ray.direction.x * 1000,
                        y2: ray.origin.y + ray.direction.y * 1000,
                        className: 'lightray',
                        vectorEffect: "non-scaling-stroke",
                        style: {stroke: RGBToCSS(wavelengthToRGB(ray.wavelength), ray.intensity)}
                    })
                )
            )
        ),

        h('g', { className: 'hitPoints'},
            hitPoints==undefined?null:hitPoints.map(hitPoint =>
                h('g', null,
                    h('line', {
                        x1: hitPoint.position.x,
                        y1: hitPoint.position.y,
                        x2: hitPoint.position.x + hitPoint.surfaceNormal.x * 20,
                        y2: hitPoint.position.y + hitPoint.surfaceNormal.y * 20,
                        className: 'hitPoint',
                        // markerEnd:'url(#head)',
                        vectorEffect: "non-scaling-stroke"
                    })
                )
            )
        ),
        
        h('g', {className: "scene"},
            Object.entries(scene).map( ([key, sceneObject])=>{
                const props = {
                    className: selectionKeys.indexOf(key)>=0 ? "sceneItem selected" : "sceneItem not-selected",
                    onClick: e=>{
                        selectionStore.setSelectionKeys([key])
                    }
                };
                if(sceneObject instanceof Circle)
                {
                    return h(CircleView, {
                        cx:sceneObject.Cx, 
                        cy:sceneObject.Cy, 
                        r:sceneObject.radius,  
                        onChange:(svgElement)=>sceneStore.updateSceneObject(key, {
                            Cx:svgElement.cx, 
                            Cy:svgElement.cy, 
                            radius:svgElement.r
                        }),
                        ...props
                    });
                }
                else if(sceneObject instanceof Rectangle)
                {
                    return h(RectView, {
                        x:sceneObject.Cx-sceneObject.width/2, 
                        y:sceneObject.Cy-sceneObject.height/2, 
                        width:sceneObject.width, 
                        height:sceneObject.height, 
                        onChange:value=>sceneStore.updateSceneObject(key, {
                            Cx: value.x+value.width/2, 
                            Cy: value.y+value.height/2, 
                            width: value.width, 
                            height: value.height
                        }),
                        ...props
                    });
                }
                else if(sceneObject instanceof LineSegment)
                {
                    return h(LineView, {
                        x1:sceneObject.Ax, 
                        y1:sceneObject.Ay, 
                        x2:sceneObject.Bx, 
                        y2:sceneObject.By, 
                        onChange:(svgElement)=>sceneStore.updateSceneObject(key, {...sceneObject,
                            Ax:svgElement.x1, 
                            Ay:svgElement.y1, 
                            Bx:svgElement.x2, 
                            By:svgElement.y2
                        }),
                        ...props
                    });
                }
                else if(sceneObject instanceof SphericalLens)
                {
                    return h(SphericalLensView, {
                        cx: sceneObject.Cx, 
                        cy: sceneObject.Cy,
                        diameter: sceneObject.diameter,
                        edgeThickness: sceneObject.edgeThickness,
                        centerThickness: sceneObject.centerThickness,
                        onChange:(value)=>sceneStore.updateSceneObject(key, {...sceneObject,
                            Cx: value.cx,
                            Cy: value.cy,
                            diameter: value.diameter,
                            edgeThickness: value.edgeThickness,
                            centerThickness: value.centerThickness
                        }),
                        ...props
                    });
                }
                else if(sceneObject instanceof DirectionalLight)
                {
                    return h(DirectionalLightView, {
                        x: sceneObject.Cx, 
                        y: sceneObject.Cy,
                        angle: sceneObject.angle,
                        width: sceneObject.width,
                        onChange:(value)=>sceneStore.updateSceneObject(key, {...sceneObject,
                            Cx: value.x,
                            Cy: value.y,
                            angle: value.angle,
                            width: value.width
                        }),
                        style: {
                            fill: RGBToCSS(temperatureToRGB(sceneObject.temperature), sceneObject.intensity)
                        },
                        ...props
                    });
                }

                else if(sceneObject instanceof LaserLight)
                {
                    return h(LaserLightView, {
                        x: sceneObject.Cx, 
                        y: sceneObject.Cy,
                        intensity: sceneObject.intensity,
                        wavelength: sceneObject.wavelength,
                        angle: sceneObject.angle,
                        onChange:(value)=>sceneStore.updateSceneObject(key, {...sceneObject,
                            Cx: value.x,
                            Cy: value.y,
                            angle: value.angle,
                            wavelength: value.wavelength,
                            intensity: value.intensity
                        }),
                        style: {
                            fill: RGBToCSS(temperatureToRGB(sceneObject.temperature), sceneObject.intensity)
                        },
                        ...props
                    });

                }
                else if(sceneObject instanceof PointLight)
                {
                    return h(PointLightView, {
                        cx: sceneObject.Cx,
                        cy: sceneObject.Cy,
                        angle: sceneObject.angle,
                        style: {
                            fill: RGBToCSS(temperatureToRGB(sceneObject.temperature), sceneObject.intensity)
                        },
                        onChange:(value)=>sceneStore.updateSceneObject(key, {...sceneObject,
                            Cx: value.cx,
                            Cy: value.cy,
                            angle: value.angle
                        }),
                        ...props
                    });
                }

                else
                {
                    return h("text", {
                        className: "shape",
                        x: sceneObject.Cx,
                        y: sceneObject.Cy,
                        ...props
                    }, `shape`)
                }
            })
        ),
    );
}

export default SVGViewport;