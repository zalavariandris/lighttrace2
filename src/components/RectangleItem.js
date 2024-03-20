import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";


const h = React.createElement;

function RectangleItem({
    rectangle,
    onChange,
    ...props
}){
    const setPos = (x, y)=>{
        const newRectangle = rectangle.copy()
        newRectangle.center.x = x
        newRectangle.center.y = y
        onChange(rectangle, newRectangle)
    }

    return h("g", {
            className: 'sceneItem rectangle',
        },
            h('rect', {
                x: rectangle.center.x - rectangle.width / 2,
                y: rectangle.center.y - rectangle.height / 2,
                width: rectangle.width,
                height: rectangle.height,
                vectorEffect: "non-scaling-stroke",
                className: "handle shape"
            }),
            h(PointManip, {
                x: rectangle.center.x,
                y: rectangle.center.y,
                onChange: (x, y)=>setPos(x, y)
            })
    )
}

export default RectangleItem;