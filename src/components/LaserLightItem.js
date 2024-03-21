import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";
import AngleManip from "./AngleManip.js";
import Manipulator from "./Manipulator.js";


const h = React.createElement;

function LaserLightItem({
    light,
    onChange,
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
        const newLight = light.copy()
        newLight.angle = newRadians;
        onChange(light, newLight)
    }

    return h(Manipulator, {
        className: "sceneItem light laser",
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-light.center.x, y: e.sceneY-light.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props

    }, 
        h('circle', {
            cx: light.center.x,
            cy: light.center.y,
            r: 2,
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

export default LaserLightItem