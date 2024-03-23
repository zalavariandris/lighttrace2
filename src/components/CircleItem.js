import React, {useState} from "react"
import Manipulator from "./Manipulator.js";

const h = React.createElement;

function CircleItem({
    circle,
    onChange,
    className,
    ...props
})
{
    const setPos = (x, y)=>{
        const newCircle = circle.copy()
        newCircle.center.x = x
        newCircle.center.y = y
        onChange(circle, newCircle)
    }

    const grabOffset = React.useRef();

    const materialName = circle.material.constructor.name

    return h(Manipulator, {
            onMouseDown: (e)=>console.log("native event still works!"),
            onDragStart: (e)=>grabOffset.current = {x: e.sceneX-circle.center.x, y: e.sceneY-circle.center.y},
            onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
            showGuide: false,
            className: ['sceneItem shape circle', materialName, className].filter(item=>item?true:false).join(" "),
            ...props
        },
        h("circle", {
            cx: circle.center.x,
            cy: circle.center.y,
            r: circle.radius,
            className: "handle shape"
        })
    )
}

export default CircleItem;