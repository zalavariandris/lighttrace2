import React, {useState} from "react"
import {Point, Vector} from "../geo.js"
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function PointLightItem({
    light,
    onChange,
    className,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (Px, Py)=>{
        const newLight = light.copy()
        newLight.x = Px;
        newLight.y = Py;
        onChange(light, newLight)
    }

    const handleAngleDrag = e=>{
        const dx = e.sceneX-light.x;
        const dy = e.sceneY-light.y;
        const newAngle = Math.atan2(dy, dx);

        const newSceneObject = light.copy()
        newSceneObject.angle = newAngle;
        onChange(light, newSceneObject);
    }



    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.x, y: e.sceneY-light.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props,
        className: ["sceneItem light point", className].filter(item=>item?true:false).join(" ")
    }, 
        h('circle', {
            cx: light.x,
            cy: light.y,
            r: 6,
            vectorEffect: "non-scaling-stroke",
            className: "shape"
        }),
        h(Manipulator, {
            onDrag: (e)=>handleAngleDrag(e),
            className:"manip",
            showGuide: false
        }, h("circle", {
            cx: light.x+Math.cos(light.angle)*50,
            cy: light.y+Math.sin(light.angle)*50,
            r: 5,
            className: "handle"
        })),
        
    )
}

export default PointLightItem