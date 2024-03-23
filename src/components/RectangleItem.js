import React, {useState} from "react"
import Manipulator from "./Manipulator.js"


const h = React.createElement;

function RectangleItem({
    rectangle,
    onChange,
    className,
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

    const materialName = rectangle.material.constructor.name;

    return h(Manipulator, {
        onDragStart: (e)=>grabOffset.current = {x: e.sceneX-rectangle.center.x, y: e.sceneY-rectangle.center.y},
        onDrag: (e)=>setPos(e.sceneX-grabOffset.current.x, e.sceneY-grabOffset.current.y),
        className: ["sceneItem shape rectangle", materialName, className].filter(item=>item?true:false).join(" "),
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