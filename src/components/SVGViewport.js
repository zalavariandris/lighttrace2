import React, {useState} from "react"

/*scene*/
import Shape from "../scene/shapes/Shape.js";
import Circle from "../scene/shapes/Circle.js"
import LineSegment from "../scene/shapes/LineSegment.js"
import Rectangle from "../scene/shapes/Rectangle.js"
import SphericalLens from "../scene/shapes/SphericalLens.js"

import Light from "../scene/lights/Light.js"
import PointLight from "../scene/lights/PointLight.js"
import LaserLight from "../scene/lights/LaserLight.js"
import DirectionalLight from "../scene/lights/DirectionalLight.js"

import Material from "../scene/materials/Material.js"
import MirrorMaterial from "../scene/materials/MirrorMaterial.js"
import TransparentMaterial from "../scene/materials/TransparentMaterial.js"
import DiffuseMaterial from "../scene/materials/DiffuseMaterial.js"

/*viewport Items*/
import CircleItem from "./CircleItem.js"
import LineSegmentItem from "./LineSegmentItem.js"
import RectangleItem from "./RectangleItem.js"
import SphericalLensItem from "./SphericalLensItem.js"

import DirectionalLightItem from "./DirectionalLightItem.js"
import PointLightItem from "./PointLightItem.js"
import LaserLightItem from "./LaserLightItem.js"


function viewboxString(viewBox)
{
    return viewBox.x+" "+viewBox.y+" "+viewBox.w+" "+viewBox.h;
}
const h = React.createElement;

function SceneItem({
    sceneObject, 
    onChange=(oldSceneObject, newSceneObject)=>{},
    ...props
})
{
    if(sceneObject instanceof Circle)
    {
        return h(CircleItem, {
            circle:sceneObject, 
            onChange: onChange,
            ...props
        })
    }
    if(sceneObject instanceof Rectangle)
    {
        return RectangleItem({
            rectangle: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof SphericalLens)
    {
        return SphericalLensItem({
            lens: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof LineSegment)
    {
        return LineSegmentItem({
            lineSegment: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof PointLight)
    {
        return PointLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof LaserLight)
    {
        return LaserLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
        })
    }

    else if(sceneObject instanceof DirectionalLight)
    {
        return DirectionalLightItem({
            light: sceneObject,
            onChange: onChange,
            ...props
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
        isPanning.current = true,
        e.preventDefault();
    }

    const onmousemove = (e)=>{
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

    const onmouseup = (e)=>{
        if (isPanning.current)
        {
            isPanning.current = false
        }
    }

    const onmouseleave = (e)=>{
        isPanning.current = false
    }

    // utils
    const pointsToSvgPath = (points)=> {
        let path = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
        return path;
    }

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
            onMouseLeave: (e) => onmouseleave(e),
            onClick: (e)=>{
                if(e.target==svgRef.current)
                {
                    onSelection([]); // clear selection
                }
            }
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
            paths.filter(path => path.points.length > 1).map(path =>
                h('g', null,
                    h('path', {
                        d: pointsToSvgPath(path.points),
                        fill: 'none',
                        stroke: `hsl(0deg 100% 100% / ${(path.intensity*100).toFixed(0)}%)`,
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
                    className: selection.indexOf(sceneObject)>=0 ? "selected" : "not-selected",
                    onClick: (e)=>onSelection([sceneObject]),
                    isSelected: selection.indexOf(sceneObject)>=0
                })
            })
        ),
    );
}

export default SVGViewport;