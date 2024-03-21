import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import {Circle, DirectonalLight, LaserLight, LineSegment, Rectangle, Lens} from "../scene.js"
import {PointLight} from "../scene.js"

import PointManip from "./PointManip.js"
import AngleManip from "./AngleManip.js"
import CircleItem from "./CircleItem.js"
import RectangleItem from "./RectangleItem.js"
import LensItem from "./LensItem.js"
import DirectionalLightItem from "./DirectionalLightItem.js"
import PointLightItem from "./PointLightItem.js"
import LaserLightItem from "./LaserLightItem.js"
import LineSegmentItem from "./LineSegmentItem.js"

function viewboxString(viewBox){
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
}
const h = React.createElement;

function SceneItem({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    isSelected, 
    onSelect=(oldSceneObject)=>{}, 
    ...props
})
{
    if(sceneObject instanceof Circle)
    {
        return h(CircleItem, {
            circle:sceneObject, 
            onChange: onChange
        })
    }
    if(sceneObject instanceof Rectangle)
    {
        return RectangleItem({
            rectangle: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof Lens)
    {
        return LensItem({
            lens: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof LineSegment)
    {
        return LineSegmentItem({
            lineSegment: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof PointLight)
    {
        return PointLightItem({
            light: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof LaserLight)
    {
        return LaserLightItem({
            light: sceneObject,
            onChange: onChange
        })
    }

    else if(sceneObject instanceof DirectonalLight)
    {
        return DirectionalLightItem({
            light: sceneObject,
            onChange: onChange
        });
    }

    return h("text", {className: "shape", x: sceneObject.center.x, y: sceneObject.center.y, fontSize:12}, `${sceneObject.constructor.name}`)

}

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
    ...props
}={})
{
    const svgRef = React.useRef()
    const isPanning = React.useRef(false)
    const prevMouse = React.useRef({x:0,y:0});

    const calcScale = ()=>{
        if(svgRef.current){
            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            return viewBox.w/clientSize.w;
        }else{
            return 1.0;
        }
    }

    // event handling
    const onmousewheel = (e)=>
    {
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

    const onmousedown = (e)=>
    {
        isPanning.current = true,
        e.preventDefault();
    }

    const onmousemove = (e)=>
    {
        if (isPanning.current)
        {
            const clientSize = {w: svgRef.current.clientWidth, h: svgRef.current.clientHeight}
            let current_scale = clientSize.w/viewBox.w;
            
            var dx = -e.movementX/current_scale;
            var dy = -e.movementY/current_scale;
            
            var newViewBox = {
                x:viewBox.x+dx,
                y:viewBox.y+dy,
                w:viewBox.w,
                h:viewBox.h
            };

            onViewChange(newViewBox)
        }
    }

    const onmouseup = (e)=>
    {
        if (isPanning.current)
        {
            isPanning.current = false
        }
    }

    const onmouseleave = (e)=>
    {
        isPanning.current = false
    }



    // utils
    const pointsToSvgPath = (points)=> {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }

    // actions


    // const manipulateGeometry = (oldObject, newGeometry)=>{
    //     onSceneObject(oldObject, newGeometry)
    // }

    return h('svg', {
            xmlns:"http://www.w3.org/2000/svg",
            width: props.width,
            height: props.height,
            className: props.className,
            style: {"--zoom": calcScale(), ...props.style},
            ref: svgRef,
            viewBox: viewboxString(viewBox),
            onMouseDown: (e) => onmousedown(e),
            onWheel: (e) => onmousewheel(e),
            onMouseMove: (e) => onmousemove(e),
            onMouseUp: (e) => onmouseup(e),
            onMouseLeave: (e) => onmouseleave(e)
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
            paths.filter(path => path.length > 1).map(points =>
                h('g', null,
                    h('path', {
                        d: pointsToSvgPath(points),
                        fill: 'none',
                        className: 'lightpath',
                        strokeLinejoin:"round",
                        strokeLinecap:"round",
                        vectorEffect: "non-scaling-stroke"
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
                        vectorEffect: "non-scaling-stroke"
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
            scene.map((sceneObject, idx)=>{
                // return h('g', {}, )

                return h(SceneItem, {
                    sceneObject: sceneObject,
                    onChange: (oldSceneObject, newSceneObject)=>onSceneObject(sceneObject, newSceneObject),
                    isSelected: selection.indexOf(sceneObject)>=0,
                    onSelect: ()=>onSelection([sceneObject]),
                })
            })
        ),
    );
}

export default SVGViewport;