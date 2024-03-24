import React, {useState} from "react"
import AngleManip from "./AngleManip.js";
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function DirectionalLightItem({
    light,
    onChange,
    className,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        const newLight = light.copy()
        newLight.x = x;
        newLight.y = y;
        onChange(light, newLight)
    }

    const setRadians = (newRadians)=>{
        const newSceneObject = light.copy()
        newSceneObject.angle = newRadians;
        onChange(light, newSceneObject)
    }

    const grabWidthOffset = React.useRef();
    const handleWidthDragStart = e=>{
        grabWidthOffset.current = {
            x: e.sceneX-light.x, 
            y: e.sceneY-light.y
        };
    }

    const handleWidthDrag = e=>{
        const dx = e.sceneX-light.x;
        const dy = e.sceneY-light.y;
        const d = Math.sqrt(dx**2+dy**2);

        const newSceneObject = light.copy()
        newSceneObject.width = d*2;
        onChange(light, newSceneObject)
    }

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.x, y: e.sceneY-light.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props,
        className: ['sceneItem light directional', className].filter(item=>item?true:false).join(" "),

    }, 
        h('rect', {
            x: light.x-6,
            y: light.y-light.width/2,
            width: 6,
            height: light.width,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {transform: `rotate(${light.angle*180/Math.PI}deg)`, transformOrigin: `${light.x}px ${light.y}px`}
        }),
        h(AngleManip, {
            x:light.x, 
            y:light.y,
            radians: light.angle,
            onChange: (newRadians)=>setRadians(newRadians)
        }),
        h(Manipulator, {
            onDragStart: e=>handleWidthDragStart(e),
            onDrag: e=>handleWidthDrag(e),
            className:"manip"
        }, h("circle", {
            cx: light.x+Math.cos(light.angle)*-3+Math.cos(light.angle+Math.PI/2)*light.width/2,
            cy: light.y+Math.sin(light.angle)*-3+Math.sin(light.angle+Math.PI/2)*light.width/2,
            r:4,
            style: {cursor: "ns-resize"},
            className: "handle"
        }))
    )
}

export default DirectionalLightItem;