import React, {useState} from "react"
import AngleManip from "./AngleManip.js";
import Manipulator from "./Manipulator.js";


const h = React.createElement;

function LaserLightItem({
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
        const newLight = light.copy()
        newLight.angle = newRadians;
        onChange(light, newLight)
    }

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.x, y: e.sceneY-light.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props,
        className: ["sceneItem light laser", className].filter(item=>item?true:false).join(" ")

    }, 
        h('circle', {
            cx: light.x,
            cy: light.y,
            r: 2,
            vectorEffect: "non-scaling-stroke",
            className: "shape"
        }),
        h(AngleManip, {
            x:light.x, 
            y:light.y,
            radians: light.angle,
            onChange: (newRadians)=>setRadians(newRadians)
        })
    )

}

export default LaserLightItem