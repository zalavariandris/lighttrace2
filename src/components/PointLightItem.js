import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";
import AngleManip from "./AngleManip.js";
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function PointLightItem({
    light,
    onChange,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (Px, Py)=>{
        const newLight = light.copy()
        newLight.center.x = Px;
        newLight.center.y = Py;
        onChange(light, newLight)
    }

    const setRadians = (newRadians)=>{
        const newLight = light.copy()
        newLight.angle = newRadians;
        onChange(light, newLight)
    }

    return h(Manipulator, {
        className: "sceneItem light point",
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.center.x, y: e.sceneY-light.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props
    }, 
        h('circle', {
            cx: light.center.x,
            cy: light.center.y,
            r: 6,
            vectorEffect: "non-scaling-stroke",
            className: "shape"
        }),
        h(AngleManip, {
            x:light.center.x, 
            y:light.center.y,
            radians: light.angle,
            onChange: (newRadians)=>setRadians(newRadians)
        })
        
    )
}

export default PointLightItem