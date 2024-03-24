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
        newLight.center.x = x;
        newLight.center.y = y;
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
            x: e.sceneX-light.center.x, 
            y: e.sceneY-light.center.y
        };
    }

    const handleWidthDrag = e=>{
        const dx = e.sceneX-light.center.x;
        const dy = e.sceneY-light.center.y;
        const d = Math.sqrt(dx**2+dy**2);

        const newSceneObject = light.copy()
        newSceneObject.width = d*2;
        onChange(light, newSceneObject)
    }

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.center.x, y: e.sceneY-light.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props,
        className: ['sceneItem light directional', className].filter(item=>item?true:false).join(" "),

    }, 
        h('rect', {
            x: light.center.x-6,
            y: light.center.y-light.width/2,
            width: 6,
            height: light.width,
            vectorEffect: "non-scaling-stroke",
            className: "shape",
            style: {transform: `rotate(${light.angle*180/Math.PI}deg)`, transformOrigin: `${light.center.x}px ${light.center.y}px`}
        }),
        h(AngleManip, {
            x:light.center.x, 
            y:light.center.y,
            radians: light.angle,
            onChange: (newRadians)=>setRadians(newRadians)
        }),
        h(Manipulator, {
            onDragStart: e=>handleWidthDragStart(e),
            onDrag: e=>handleWidthDrag(e),
            className:"manip"
        }, h("circle", {
            cx: light.center.x+Math.cos(light.angle)*-3+Math.cos(light.angle+Math.PI/2)*light.width/2,
            cy: light.center.y+Math.sin(light.angle)*-3+Math.sin(light.angle+Math.PI/2)*light.width/2,
            r:4,
            style: {cursor: "ns-resize"},
            className: "handle"
        }))
    )
}

export default DirectionalLightItem;