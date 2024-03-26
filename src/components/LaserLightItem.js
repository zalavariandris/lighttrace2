import React, {useState} from "react"
import Manipulator from "../manipulators/Manipulator.js";
import {colorFromRGB, wavelengthToRGB} from "../colorUtils.js"

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
        onChange(light.key, {x:x, y:y})
    }

    const handleAngleDrag = e=>{
        const dx = e.sceneX-light.x;
        const dy = e.sceneY-light.y;
        const newAngle = Math.atan2(dy, dx);
        onChange(light.key, {angle: newAngle});
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
            className: "shape",
            style: {
                fill: colorFromRGB(wavelengthToRGB(light.wavelength))
            }
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

export default LaserLightItem