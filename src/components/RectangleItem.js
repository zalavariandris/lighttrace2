import React, {useState} from "react"
import {Point, Vector, Ray} from "../geo.js"
import PointManip from "./PointManip.js";
import Manipulator from "./Manipulator.js"


const h = React.createElement;

function RectangleItem({
    rectangle,
    onChange,
    ...props
})
{
    const grabOffset = React.useRef();
    const setPos = (x, y)=>{
        const newRectangle = rectangle.copy()
        newRectangle.center.x = x
        newRectangle.center.y = y
        onChange(rectangle, newRectangle)
    }

    return h(Manipulator, {
        className: "sceneItem shape rectangle",
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-rectangle.center.x, y: e.sceneY-rectangle.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        ...props
        },
            h('rect', {
                x: rectangle.center.x - rectangle.width / 2,
                y: rectangle.center.y - rectangle.height / 2,
                width: rectangle.width,
                height: rectangle.height,
                vectorEffect: "non-scaling-stroke",
                className: "handle shape"
            })
    )
}

export default RectangleItem;