import React, {useState} from "react"
import {RGBToCSS, wavelengthToRGB} from "../scene/colorUtils.js"


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

const h = React.createElement;
function SVGViewport({
    viewBox={x:0, y:0, w:512, h:512}, 
    onViewChange=()=>{},
    scene=[],
    onSceneObject=()=>{},
    rays=[], 
    hitPoints=[], 
    paths=[], 
    selection=[],
    onSelection=()=>{},
    onMouseDown=()=>{},
    ...props
}={})
{
    const svgRef = React.useRef()

    const calcScale = ()=>{
        if(svgRef.current){
            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            return viewBox.w/clientSize.w;
        }else{
            return 1.0;
        }
    }

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

    const onmousedown = (e)=>{
        
        if(props.onMouseDown){
            props.onMouseDown(e);
        }
        if(e.defaultPrevented){
            return;
        }

        const panBegin = {x: e.clientX, y: e.clientY};

        const onmousemove = (e)=>{
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
    
        const onmouseup = (e)=>{
            console.log("window mouseup")
            window.removeEventListener('mousemove', onmousemove);
        }

        window.addEventListener('mousemove', onmousemove);
        window.addEventListener('mouseup', onmouseup, {once: true});
    }



    return h('svg', {
            xmlns:"http://www.w3.org/2000/svg",
            width: props.width,
            height: props.height,
            className: props.className,
            style: {"--zoom": calcScale(), ...props.style},
            ref: svgRef,
            viewBox: viewboxString(viewBox),
            ...props,
            onMouseDown: (e) => onmousedown(e),
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
                    props.children

        ),
    );
}

export default SVGViewport;