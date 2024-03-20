import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";


const h = React.createElement;

function CircleItem({
    circle,
    onChange,
    ...props
})
{
    const setPos = (x, y)=>{
        const newCircle = circle.copy()
        newCircle.center.x = x
        newCircle.center.y = y
        onChange(circle, newCircle)
    }

    const setRadius = (oldObject, newRadius)=>{

    }

    return h("g", {
            className: 'sceneItem circle',
        },
        h("circle", {
            cx: circle.center.x,
            cy: circle.center.y,
            r: circle.radius,
            className: "handle shape"
        }),
        h(PointManip, {
            x: circle.center.x,
            y: circle.center.y,
            onChange: (x, y)=>setPos(x, y)
        })
    )
}

export default CircleItem;